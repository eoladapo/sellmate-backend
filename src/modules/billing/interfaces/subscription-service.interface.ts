import { Subscription } from '../entities';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from '../enums';

/**
 * Change plan request (replaces separate upgrade/downgrade requests)
 */
export interface ChangePlanRequest {
  plan: SubscriptionPlan;
  billingCycle?: BillingCycle;
}

/**
 * Paystack authorization data from successful payment
 */
export interface PaystackAuthorization {
  authorizationCode: string;
  customerCode?: string;
}

/**
 * Simplified subscription summary response (MVP)
 * Removed: usageLimits, currentUsage, paymentMethods
 */
export interface SubscriptionSummary {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  amount: number;
  currency: string;
  nextPaymentDate?: Date;
  daysUntilRenewal: number;
  isTrialActive: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

/**
 * Simplified subscription service interface (MVP)
 * Removed: usage tracking, payment method management
 * Consolidated: upgrade/downgrade into changePlan
 * Added: Paystack integration methods (merged from BillingService)
 */
export interface ISubscriptionService {
  /**
   * Get subscription for a user
   */
  getSubscription(userId: string): Promise<Subscription>;

  /**
   * Get subscription summary
   */
  getSubscriptionSummary(userId: string): Promise<SubscriptionSummary>;

  /**
   * Initialize subscription for new user
   */
  initializeSubscription(userId: string): Promise<Subscription>;

  /**
   * Change subscription plan (handles both upgrades and downgrades)
   * - Upgrades: Take effect immediately
   * - Downgrades: Take effect at end of current billing period
   */
  changePlan(userId: string, request: ChangePlanRequest): Promise<Subscription>;

  /**
   * Cancel subscription
   */
  cancelSubscription(userId: string): Promise<Subscription>;

  /**
   * Reactivate cancelled subscription
   */
  reactivateSubscription(userId: string): Promise<Subscription>;

  /**
   * Activate subscription after successful Paystack payment
   */
  activateAfterPayment(
    userId: string,
    paystackAuth: PaystackAuthorization
  ): Promise<Subscription>;

  /**
   * Handle successful payment webhook from Paystack
   */
  handlePaymentSuccess(userId: string): Promise<Subscription>;

  /**
   * Handle failed payment webhook from Paystack
   */
  handlePaymentFailure(userId: string): Promise<Subscription>;

  /**
   * Get plan pricing
   */
  getPlanPricing(plan: SubscriptionPlan, billingCycle: BillingCycle): number;

  // ============================================
  // Paystack Integration Methods
  // ============================================

  /**
   * Initialize a Paystack payment transaction
   */
  initializePayment(
    userId: string,
    email: string,
    amount: number,
    description: string,
    callbackUrl?: string
  ): Promise<InitializePaymentResponse>;

  /**
   * Verify a Paystack payment after callback
   */
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean;

  /**
   * Handle Paystack webhook events
   */
  handleWebhook(event: string, data: Record<string, unknown>): Promise<void>;
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
 * Verify payment result
 */
export interface VerifyPaymentResult {
  success: boolean;
  message: string;
  authorizationCode?: string;
  customerCode?: string;
}
