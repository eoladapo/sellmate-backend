import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../../di/tokens';
import { Subscription, PLAN_PRICING } from '../entities';
import { SubscriptionRepository } from '../repositories';
import {
  ISubscriptionService,
  ChangePlanRequest,
  SubscriptionSummary,
  PaystackAuthorization,
} from '../interfaces';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from '../enums';
import { PaystackService } from './paystack.service';

/**
 * Initialize payment response
 */
export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Verify payment result
 */
export interface VerifyPaymentResult {
  success: boolean;
  message: string;
  authorizationCode?: string;
  customerCode?: string;
}

/**
 * Simplified subscription service for MVP
 * - Removed usage tracking (deferred to post-MVP)
 * - Removed payment method management (Paystack handles card storage)
 * - Consolidated upgrade/downgrade into single changePlan method
 * - Merged essential Paystack methods from BillingService
 */
@injectable()
export class SubscriptionService implements ISubscriptionService {
  private paystackService: PaystackService;

  constructor(@inject(TOKENS.SubscriptionRepository) private subscriptionRepository: SubscriptionRepository) {
    this.paystackService = new PaystackService();
  }

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

  /**
   * Change subscription plan (handles both upgrades and downgrades)
   * - Upgrades: Take effect immediately with new billing period
   * - Downgrades: Scheduled to take effect at end of current billing period
   */
  async changePlan(
    userId: string,
    request: ChangePlanRequest
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    // Validate plan change - cannot change to same plan
    if (request.plan === subscription.plan) {
      throw new Error('Cannot change to the same plan');
    }

    const planOrder = [SubscriptionPlan.STARTER, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.BUSINESS];
    const currentIndex = planOrder.indexOf(subscription.plan);
    const newIndex = planOrder.indexOf(request.plan);
    const isUpgrade = newIndex > currentIndex;

    const billingCycle = request.billingCycle || subscription.billingCycle;
    const newAmount = this.getPlanPricing(request.plan, billingCycle);

    if (isUpgrade) {
      // Upgrades take effect immediately
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
        amount: newAmount,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextPaymentDate: periodEnd,
        trialEnd: undefined, // End trial on upgrade
      });
    } else {
      // Downgrades take effect at end of current period
      // Only update plan, billingCycle, and amount - keep current period unchanged
      return this.subscriptionRepository.update(userId, {
        plan: request.plan,
        billingCycle,
        amount: newAmount,
      });
    }
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

  /**
   * Activate subscription after successful Paystack payment
   * Stores authorization code for recurring charges
   */
  async activateAfterPayment(
    userId: string,
    paystackAuth: PaystackAuthorization
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    const now = new Date();
    const periodEnd = new Date(now);
    if (subscription.billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.subscriptionRepository.update(userId, {
      status: SubscriptionStatus.ACTIVE,
      paystackAuthorizationCode: paystackAuth.authorizationCode,
      paystackCustomerCode: paystackAuth.customerCode,
      lastPaymentDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextPaymentDate: periodEnd,
      trialEnd: undefined, // End trial on payment
    });
  }

  /**
   * Handle successful payment webhook from Paystack
   * Updates subscription period and last payment date
   */
  async handlePaymentSuccess(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    const now = new Date();
    const periodEnd = new Date(now);
    if (subscription.billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.subscriptionRepository.update(userId, {
      status: SubscriptionStatus.ACTIVE,
      lastPaymentDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextPaymentDate: periodEnd,
    });
  }

  /**
   * Handle failed payment webhook from Paystack
   * Marks subscription as past_due
   */
  async handlePaymentFailure(userId: string): Promise<Subscription> {
    return this.subscriptionRepository.update(userId, {
      status: SubscriptionStatus.PAST_DUE,
    });
  }

  getPlanPricing(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
    const pricing = PLAN_PRICING[plan];
    return billingCycle === BillingCycle.YEARLY ? pricing.yearly : pricing.monthly;
  }

  // ============================================
  // Paystack Integration Methods (merged from BillingService)
  // ============================================

  /**
   * Initialize a payment transaction (redirects user to Paystack)
   */
  async initializePayment(
    userId: string,
    email: string,
    amount: number,
    description: string,
    callbackUrl?: string
  ): Promise<InitializePaymentResponse> {
    const reference = this.paystackService.generateReference('SM');

    const result = await this.paystackService.initializeTransaction(
      email,
      amount,
      reference,
      {
        userId,
        description,
        type: 'subscription_payment',
      },
      callbackUrl
    );

    return {
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
    };
  }

  /**
   * Verify a payment after callback from Paystack
   * Returns authorization data for storing if payment successful
   */
  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    try {
      const verification = await this.paystackService.verifyTransaction(reference);

      if (verification.status === 'success') {
        const userId = verification.metadata?.userId as string;

        if (userId && verification.authorization.reusable) {
          // Activate subscription with authorization
          await this.activateAfterPayment(userId, {
            authorizationCode: verification.authorization.authorization_code,
            customerCode: verification.customer.customer_code,
          });
        }

        return {
          success: true,
          message: 'Payment verified successfully',
          authorizationCode: verification.authorization.authorization_code,
          customerCode: verification.customer.customer_code,
        };
      } else {
        const userId = verification.metadata?.userId as string;
        if (userId) {
          await this.handlePaymentFailure(userId);
        }

        return {
          success: false,
          message: verification.gateway_response || 'Payment verification failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    return this.paystackService.verifyWebhookSignature(payload, signature);
  }

  /**
   * Handle Paystack webhook events
   */
  async handleWebhook(event: string, data: Record<string, unknown>): Promise<void> {
    switch (event) {
      case 'charge.success':
        await this.handleChargeSuccessWebhook(data);
        break;
      case 'charge.failed':
        await this.handleChargeFailedWebhook(data);
        break;
      default:
        console.log(`Unhandled Paystack webhook event: ${event}`);
    }
  }

  // Private webhook handlers

  private async handleChargeSuccessWebhook(data: Record<string, unknown>): Promise<void> {
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.userId as string;

    if (userId) {
      await this.handlePaymentSuccess(userId);
    }
  }

  private async handleChargeFailedWebhook(data: Record<string, unknown>): Promise<void> {
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.userId as string;

    if (userId) {
      await this.handlePaymentFailure(userId);
    }
  }
}
