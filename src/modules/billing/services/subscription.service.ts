import {
  Subscription,
  PaymentMethod,
  UsageLimits,
  CurrentUsage,
  PLAN_LIMITS,
  PLAN_PRICING,
} from '../entities';
import { SubscriptionRepository } from '../repositories';
import {
  ISubscriptionService,
  AddPaymentMethodRequest,
  UpgradeSubscriptionRequest,
  SubscriptionSummary,
  UsageCheckResult,
} from '../interfaces';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from '../enums';

/**
 * Subscription service implementation
 */
export class SubscriptionService implements ISubscriptionService {
  constructor(private subscriptionRepository: SubscriptionRepository) { }

  async getSubscription(userId: string): Promise<Subscription> {
    return this.subscriptionRepository.getOrCreate(userId);
  }

  async getSubscriptionSummary(userId: string): Promise<SubscriptionSummary> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const now = new Date();

    const daysUntilRenewal = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isTrialActive =
      subscription.status === SubscriptionStatus.TRIAL &&
      subscription.trialEnd !== undefined &&
      subscription.trialEnd > now;

    const canUpgrade = subscription.plan !== SubscriptionPlan.BUSINESS;
    const canDowngrade = subscription.plan !== SubscriptionPlan.STARTER;

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
      amount: subscription.amount,
      currency: subscription.currency,
      usageLimits: subscription.usageLimits,
      currentUsage: subscription.currentUsage,
      paymentMethods: subscription.paymentMethods,
      nextPaymentDate: subscription.nextPaymentDate,
      daysUntilRenewal,
      isTrialActive,
      canUpgrade,
      canDowngrade,
    };
  }

  async initializeSubscription(userId: string): Promise<Subscription> {
    const existing = await this.subscriptionRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }
    return this.subscriptionRepository.create(userId);
  }

  async upgradeSubscription(
    userId: string,
    request: UpgradeSubscriptionRequest
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    // Validate upgrade path
    const planOrder = [SubscriptionPlan.STARTER, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.BUSINESS];
    const currentIndex = planOrder.indexOf(subscription.plan);
    const newIndex = planOrder.indexOf(request.plan);

    if (newIndex <= currentIndex) {
      throw new Error('Cannot upgrade to the same or lower plan. Use downgrade instead.');
    }

    const billingCycle = request.billingCycle || subscription.billingCycle;
    const newAmount = this.getPlanPricing(request.plan, billingCycle);
    const newLimits = this.getPlanLimits(request.plan);

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.subscriptionRepository.update(userId, {
      plan: request.plan,
      billingCycle,
      status: SubscriptionStatus.ACTIVE,
      usageLimits: newLimits,
      amount: newAmount,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextPaymentDate: periodEnd,
      trialEnd: undefined, // End trial on upgrade
    });
  }

  async downgradeSubscription(
    userId: string,
    request: UpgradeSubscriptionRequest
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    // Validate downgrade path
    const planOrder = [SubscriptionPlan.STARTER, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.BUSINESS];
    const currentIndex = planOrder.indexOf(subscription.plan);
    const newIndex = planOrder.indexOf(request.plan);

    if (newIndex >= currentIndex) {
      throw new Error('Cannot downgrade to the same or higher plan. Use upgrade instead.');
    }

    // Check if current usage exceeds new plan limits
    const newLimits = this.getPlanLimits(request.plan);
    const usage = subscription.currentUsage;

    if (newLimits.maxConversations !== -1 && usage.conversations > newLimits.maxConversations) {
      throw new Error(`Current conversation count (${usage.conversations}) exceeds new plan limit (${newLimits.maxConversations})`);
    }
    if (newLimits.maxOrders !== -1 && usage.orders > newLimits.maxOrders) {
      throw new Error(`Current order count (${usage.orders}) exceeds new plan limit (${newLimits.maxOrders})`);
    }
    if (newLimits.maxCustomers !== -1 && usage.customers > newLimits.maxCustomers) {
      throw new Error(`Current customer count (${usage.customers}) exceeds new plan limit (${newLimits.maxCustomers})`);
    }

    const billingCycle = request.billingCycle || subscription.billingCycle;
    const newAmount = this.getPlanPricing(request.plan, billingCycle);

    // Downgrade takes effect at end of current period
    return this.subscriptionRepository.update(userId, {
      plan: request.plan,
      billingCycle,
      usageLimits: newLimits,
      amount: newAmount,
      // Keep current period, change takes effect at renewal
    });
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new Error('Subscription is already cancelled');
    }

    return this.subscriptionRepository.update(userId, {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    });
  }

  async reactivateSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new Error('Only cancelled subscriptions can be reactivated');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (subscription.billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.subscriptionRepository.update(userId, {
      status: SubscriptionStatus.ACTIVE,
      cancelledAt: undefined,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextPaymentDate: periodEnd,
    });
  }

  async addPaymentMethod(
    userId: string,
    request: AddPaymentMethodRequest
  ): Promise<PaymentMethod[]> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const paymentMethods = [...subscription.paymentMethods];

    const newMethod: PaymentMethod = {
      type: request.type,
      last4: request.last4,
      expiryMonth: request.expiryMonth,
      expiryYear: request.expiryYear,
      bankName: request.bankName,
      accountLast4: request.accountLast4,
      mobileNumber: request.mobileNumber,
      provider: request.provider,
      isDefault: request.setAsDefault || paymentMethods.length === 0,
    };

    // If setting as default, unset other defaults
    if (newMethod.isDefault) {
      paymentMethods.forEach((pm) => (pm.isDefault = false));
    }

    paymentMethods.push(newMethod);

    await this.subscriptionRepository.update(userId, { paymentMethods });
    return paymentMethods;
  }

  async removePaymentMethod(userId: string, index: number): Promise<PaymentMethod[]> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const paymentMethods = [...subscription.paymentMethods];

    if (index < 0 || index >= paymentMethods.length) {
      throw new Error('Invalid payment method index');
    }

    const wasDefault = paymentMethods[index].isDefault;
    paymentMethods.splice(index, 1);

    // If removed method was default, set first remaining as default
    if (wasDefault && paymentMethods.length > 0) {
      paymentMethods[0].isDefault = true;
    }

    await this.subscriptionRepository.update(userId, { paymentMethods });
    return paymentMethods;
  }

  async setDefaultPaymentMethod(userId: string, index: number): Promise<PaymentMethod[]> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const paymentMethods = [...subscription.paymentMethods];

    if (index < 0 || index >= paymentMethods.length) {
      throw new Error('Invalid payment method index');
    }

    paymentMethods.forEach((pm, i) => (pm.isDefault = i === index));

    await this.subscriptionRepository.update(userId, { paymentMethods });
    return paymentMethods;
  }

  async checkUsageLimit(
    userId: string,
    resource: keyof UsageLimits
  ): Promise<UsageCheckResult> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const limit = subscription.usageLimits[resource];

    // Map resource to usage field
    const usageMap: Record<keyof UsageLimits, keyof CurrentUsage> = {
      maxConversations: 'conversations',
      maxOrders: 'orders',
      maxCustomers: 'customers',
      maxIntegrations: 'integrations',
      aiRequestsPerMonth: 'aiRequestsThisMonth',
      storageGB: 'storageUsedGB',
    };

    const usageField = usageMap[resource];
    const currentValue = subscription.currentUsage[usageField] as number;

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        currentValue,
        limit: -1,
        percentUsed: 0,
        message: 'Unlimited usage',
      };
    }

    const percentUsed = Math.round((currentValue / limit) * 100);
    const allowed = currentValue < limit;

    return {
      allowed,
      currentValue,
      limit,
      percentUsed,
      message: allowed
        ? `${percentUsed}% of limit used`
        : `Limit reached. Upgrade your plan for more ${resource}.`,
    };
  }

  async incrementUsage(
    userId: string,
    resource: keyof CurrentUsage,
    amount: number = 1
  ): Promise<CurrentUsage> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const currentUsage = { ...subscription.currentUsage };

    if (typeof currentUsage[resource] === 'number') {
      (currentUsage[resource] as number) += amount;
    }

    await this.subscriptionRepository.update(userId, { currentUsage });
    return currentUsage;
  }

  async resetMonthlyUsage(userId: string): Promise<CurrentUsage> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const currentUsage = {
      ...subscription.currentUsage,
      aiRequestsThisMonth: 0,
      lastResetDate: new Date(),
    };

    await this.subscriptionRepository.update(userId, { currentUsage });
    return currentUsage;
  }

  getPlanPricing(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
    const pricing = PLAN_PRICING[plan];
    return billingCycle === BillingCycle.YEARLY ? pricing.yearly : pricing.monthly;
  }

  getPlanLimits(plan: SubscriptionPlan): UsageLimits {
    return { ...PLAN_LIMITS[plan] };
  }
}
