import {
  Subscription,
  PaymentMethod,
  UsageLimits,
  CurrentUsage,
} from '../entities';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  PaymentMethodType,
} from '../enums';

/**
 * Add payment method request
 */
export interface AddPaymentMethodRequest {
  type: PaymentMethodType;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountLast4?: string;
  mobileNumber?: string;
  provider?: string;
  setAsDefault?: boolean;
}

/**
 * Upgrade subscription request
 */
export interface UpgradeSubscriptionRequest {
  plan: SubscriptionPlan;
  billingCycle?: BillingCycle;
}

/**
 * Subscription summary response
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
  usageLimits: UsageLimits;
  currentUsage: CurrentUsage;
  paymentMethods: PaymentMethod[];
  nextPaymentDate?: Date;
  daysUntilRenewal: number;
  isTrialActive: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

/**
 * Usage check result
 */
export interface UsageCheckResult {
  allowed: boolean;
  currentValue: number;
  limit: number;
  percentUsed: number;
  message?: string;
}

/**
 * Subscription service interface
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
   * Upgrade subscription plan
   */
  upgradeSubscription(
    userId: string,
    request: UpgradeSubscriptionRequest
  ): Promise<Subscription>;

  /**
   * Downgrade subscription plan
   */
  downgradeSubscription(
    userId: string,
    request: UpgradeSubscriptionRequest
  ): Promise<Subscription>;

  /**
   * Cancel subscription
   */
  cancelSubscription(userId: string): Promise<Subscription>;

  /**
   * Reactivate cancelled subscription
   */
  reactivateSubscription(userId: string): Promise<Subscription>;

  /**
   * Add payment method
   */
  addPaymentMethod(
    userId: string,
    paymentMethod: AddPaymentMethodRequest
  ): Promise<PaymentMethod[]>;

  /**
   * Remove payment method
   */
  removePaymentMethod(userId: string, index: number): Promise<PaymentMethod[]>;

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(userId: string, index: number): Promise<PaymentMethod[]>;

  /**
   * Check if user can perform action based on usage limits
   */
  checkUsageLimit(
    userId: string,
    resource: keyof UsageLimits
  ): Promise<UsageCheckResult>;

  /**
   * Increment usage counter
   */
  incrementUsage(
    userId: string,
    resource: keyof CurrentUsage,
    amount?: number
  ): Promise<CurrentUsage>;

  /**
   * Reset monthly usage counters
   */
  resetMonthlyUsage(userId: string): Promise<CurrentUsage>;

  /**
   * Get plan pricing
   */
  getPlanPricing(plan: SubscriptionPlan, billingCycle: BillingCycle): number;

  /**
   * Get plan limits
   */
  getPlanLimits(plan: SubscriptionPlan): UsageLimits;
}
