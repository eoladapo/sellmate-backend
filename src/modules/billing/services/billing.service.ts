import { SubscriptionRepository } from '../repositories';
import {
  IBillingService,
  ProcessPaymentRequest,
  ProcessPaymentResult,
  BillingCycleInfo,
  PlanChangeCalculation,
  PaymentRecord,
} from '../interfaces';
import { PLAN_PRICING, PaymentMethod } from '../entities';
import {
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  PaymentMethodType,
} from '../enums';
import { PaystackService } from './paystack.service';

/**
 * In-memory payment records storage (in production, use a database table)
 */
const paymentRecords: Map<string, PaymentRecord[]> = new Map();

/**
 * Extended payment request with email for Paystack
 */
export interface ProcessPaymentWithEmailRequest extends ProcessPaymentRequest {
  email: string;
  authorizationCode?: string;
}

/**
 * Initialize payment response
 */
export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Billing service implementation with Paystack integration
 */
export class BillingService implements IBillingService {
  private paystackService: PaystackService;

  constructor(private subscriptionRepository: SubscriptionRepository) {
    this.paystackService = new PaystackService();
  }

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
   */
  async verifyPayment(reference: string): Promise<ProcessPaymentResult> {
    try {
      const verification = await this.paystackService.verifyTransaction(reference);

      if (verification.status === 'success') {
        const userId = verification.metadata?.userId as string;

        if (userId) {
          // Store authorization for future recurring payments
          await this.storePaymentAuthorization(userId, verification);
          await this.handlePaymentSuccess(userId, reference);
        }

        return {
          success: true,
          paymentId: reference,
          status: PaymentStatus.COMPLETED,
          message: 'Payment verified successfully',
          processedAt: new Date(verification.paid_at),
        };
      } else {
        const userId = verification.metadata?.userId as string;
        if (userId) {
          await this.handlePaymentFailure(userId, verification.gateway_response);
        }

        return {
          success: false,
          paymentId: reference,
          status: PaymentStatus.FAILED,
          message: verification.gateway_response || 'Payment verification failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  /**
   * Charge a saved card (for recurring payments)
   */
  async chargeRecurring(
    userId: string,
    email: string,
    amount: number,
    description: string
  ): Promise<ProcessPaymentResult> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    // Find payment method with authorization code
    const paymentMethod = subscription.paymentMethods.find(
      (pm) => pm.isDefault && pm.authorizationCode
    );

    if (!paymentMethod?.authorizationCode) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: 'No saved payment method with authorization. Please make a new payment.',
      };
    }

    const reference = this.paystackService.generateReference('SM_REC');

    try {
      const result = await this.paystackService.chargeAuthorization(
        email,
        amount,
        paymentMethod.authorizationCode,
        reference,
        { userId, description, type: 'recurring_payment' }
      );

      if (result.status === 'success') {
        await this.handlePaymentSuccess(userId, reference);
        this.recordPayment(userId, subscription.id, amount, 'NGN', PaymentStatus.COMPLETED, paymentMethod, description, reference);

        return {
          success: true,
          paymentId: reference,
          status: PaymentStatus.COMPLETED,
          message: 'Recurring payment processed successfully',
          processedAt: new Date(),
        };
      } else {
        await this.handlePaymentFailure(userId, result.gateway_response);
        this.recordPayment(userId, subscription.id, amount, 'NGN', PaymentStatus.FAILED, paymentMethod, description, reference, result.gateway_response);

        return {
          success: false,
          paymentId: reference,
          status: PaymentStatus.FAILED,
          message: result.gateway_response || 'Recurring payment failed',
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment processing failed';
      await this.handlePaymentFailure(userId, message);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        message,
      };
    }
  }

  async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResult> {
    const subscription = await this.subscriptionRepository.getOrCreate(request.userId);

    if (
      request.paymentMethodIndex < 0 ||
      request.paymentMethodIndex >= subscription.paymentMethods.length
    ) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: 'Invalid payment method',
      };
    }

    const paymentMethod = subscription.paymentMethods[request.paymentMethodIndex];

    // If we have an authorization code, use recurring charge
    if (paymentMethod.authorizationCode) {
      // We need email for Paystack - this should come from user profile
      // For now, return error asking to use chargeRecurring directly
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: 'Use chargeRecurring method for recurring payments with email',
      };
    }

    // For new payments without authorization, return instruction to initialize
    return {
      success: false,
      status: PaymentStatus.PENDING,
      message: 'Please initialize a new payment using initializePayment method',
    };
  }

  async handlePaymentFailure(userId: string, _reason: string): Promise<void> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const failedCount = subscription.failedPaymentCount + 1;

    const updates: Partial<typeof subscription> = {
      failedPaymentCount: failedCount,
    };

    // After 3 failed attempts, mark as past due
    if (failedCount >= 3) {
      updates.status = SubscriptionStatus.PAST_DUE;
    }

    await this.subscriptionRepository.update(userId, updates);
  }

  async handlePaymentSuccess(userId: string, _paymentId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const now = new Date();

    const periodEnd = new Date(now);
    if (subscription.billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await this.subscriptionRepository.update(userId, {
      status: SubscriptionStatus.ACTIVE,
      failedPaymentCount: 0,
      lastPaymentDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextPaymentDate: periodEnd,
    });
  }

  async calculatePlanChange(
    userId: string,
    newPlan: SubscriptionPlan,
    newBillingCycle?: BillingCycle
  ): Promise<PlanChangeCalculation> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const billingCycle = newBillingCycle || subscription.billingCycle;

    const now = new Date();
    const daysInPeriod = this.getDaysInPeriod(subscription.billingCycle);
    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // Calculate prorated credit for remaining days
    const dailyRate = subscription.amount / daysInPeriod;
    const proratedCredit = Math.round(dailyRate * daysRemaining * 100) / 100;

    // Get new plan cost
    const newPlanCost = this.getPlanPricing(newPlan, billingCycle);

    // Calculate amount due (new plan cost minus credit)
    const amountDue = Math.max(0, newPlanCost - proratedCredit);

    return {
      currentPlan: subscription.plan,
      newPlan,
      currentBillingCycle: subscription.billingCycle,
      newBillingCycle: billingCycle,
      proratedCredit,
      newPlanCost,
      amountDue,
      effectiveDate: now,
    };
  }

  async getBillingCycleInfo(userId: string): Promise<BillingCycleInfo> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const now = new Date();

    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    return {
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextPaymentDate || subscription.currentPeriodEnd,
      daysRemaining,
      amount: subscription.amount,
      currency: subscription.currency,
    };
  }

  async processRenewal(userId: string): Promise<ProcessPaymentResult> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    // Find default payment method with authorization
    const paymentMethod = subscription.paymentMethods.find(
      (pm) => pm.isDefault && pm.authorizationCode
    );

    if (!paymentMethod) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: 'No default payment method found for renewal',
      };
    }

    // We need email - in production, get from user profile
    // For now, return error
    return {
      success: false,
      status: PaymentStatus.FAILED,
      message: 'Email required for renewal. Use chargeRecurring method.',
    };
  }

  async getPaymentHistory(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaymentRecord[]> {
    const userPayments = paymentRecords.get(userId) || [];
    return userPayments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async retryFailedPayment(userId: string): Promise<ProcessPaymentResult> {
    const subscription = await this.subscriptionRepository.getOrCreate(userId);

    if (subscription.status !== SubscriptionStatus.PAST_DUE) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: 'No failed payment to retry',
      };
    }

    return this.processRenewal(userId);
  }

  async checkPendingRenewals(): Promise<string[]> {
    const subscriptions = await this.subscriptionRepository.findExpiringSoon(3);
    return subscriptions.map((s) => s.userId);
  }

  /**
   * Handle Paystack webhook events
   */
  async handleWebhook(event: string, data: Record<string, unknown>): Promise<void> {
    switch (event) {
      case 'charge.success':
        await this.handleChargeSuccess(data);
        break;
      case 'charge.failed':
        await this.handleChargeFailed(data);
        break;
      case 'subscription.create':
        // Handle subscription created
        break;
      case 'subscription.disable':
        // Handle subscription disabled
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(data);
        break;
      default:
        console.log(`Unhandled Paystack webhook event: ${event}`);
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    return this.paystackService.verifyWebhookSignature(payload, signature);
  }

  // Private helper methods

  private async storePaymentAuthorization(
    userId: string,
    verification: {
      authorization: {
        authorization_code: string;
        last4: string;
        exp_month: string;
        exp_year: string;
        card_type: string;
        bank: string;
        brand: string;
        reusable: boolean;
      };
    }
  ): Promise<void> {
    if (!verification.authorization.reusable) {
      return;
    }

    const subscription = await this.subscriptionRepository.getOrCreate(userId);
    const auth = verification.authorization;

    // Check if this card is already saved
    const existingIndex = subscription.paymentMethods.findIndex(
      (pm) => pm.last4 === auth.last4 && pm.expiryMonth === parseInt(auth.exp_month)
    );

    const paymentMethod: PaymentMethod = {
      type: PaymentMethodType.CARD,
      last4: auth.last4,
      expiryMonth: parseInt(auth.exp_month),
      expiryYear: parseInt(auth.exp_year),
      bankName: auth.bank,
      provider: auth.brand,
      isDefault: subscription.paymentMethods.length === 0,
      authorizationCode: auth.authorization_code,
    };

    const paymentMethods = [...subscription.paymentMethods];

    if (existingIndex >= 0) {
      // Update existing
      paymentMethods[existingIndex] = {
        ...paymentMethods[existingIndex],
        authorizationCode: auth.authorization_code,
      };
    } else {
      // Add new
      paymentMethods.push(paymentMethod);
    }

    await this.subscriptionRepository.update(userId, { paymentMethods });
  }

  private async handleChargeSuccess(data: Record<string, unknown>): Promise<void> {
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.userId as string;

    if (userId) {
      await this.handlePaymentSuccess(userId, data.reference as string);
    }
  }

  private async handleChargeFailed(data: Record<string, unknown>): Promise<void> {
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.userId as string;

    if (userId) {
      await this.handlePaymentFailure(userId, (data.gateway_response as string) || 'Payment failed');
    }
  }

  private async handleInvoicePaymentFailed(data: Record<string, unknown>): Promise<void> {
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.userId as string;

    if (userId) {
      await this.handlePaymentFailure(userId, 'Invoice payment failed');
    }
  }

  private recordPayment(
    userId: string,
    subscriptionId: string,
    amount: number,
    currency: string,
    status: PaymentStatus,
    paymentMethod: PaymentMethod,
    description: string,
    reference: string,
    failureReason?: string
  ): void {
    const paymentRecord: PaymentRecord = {
      id: reference,
      subscriptionId,
      userId,
      amount,
      currency,
      status,
      paymentMethod,
      description,
      createdAt: new Date(),
      processedAt: status === PaymentStatus.COMPLETED ? new Date() : undefined,
      failureReason,
    };

    const userPayments = paymentRecords.get(userId) || [];
    userPayments.push(paymentRecord);
    paymentRecords.set(userId, userPayments);
  }

  private getDaysInPeriod(billingCycle: BillingCycle): number {
    return billingCycle === BillingCycle.YEARLY ? 365 : 30;
  }

  private getPlanPricing(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
    const pricing = PLAN_PRICING[plan];
    return billingCycle === BillingCycle.YEARLY ? pricing.yearly : pricing.monthly;
  }
}
