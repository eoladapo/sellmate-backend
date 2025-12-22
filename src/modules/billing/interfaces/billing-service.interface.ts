import { PaymentMethod } from '../entities';
import { PaymentStatus, SubscriptionPlan, BillingCycle } from '../enums';

/**
 * Payment record
 */
export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  description: string;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

/**
 * Process payment request
 */
export interface ProcessPaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  paymentMethodIndex: number;
  description: string;
}

/**
 * Process payment result
 */
export interface ProcessPaymentResult {
  success: boolean;
  paymentId?: string;
  status: PaymentStatus;
  message: string;
  processedAt?: Date;
}

/**
 * Billing cycle info
 */
export interface BillingCycleInfo {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  daysRemaining: number;
  amount: number;
  currency: string;
}

/**
 * Plan change calculation
 */
export interface PlanChangeCalculation {
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  currentBillingCycle: BillingCycle;
  newBillingCycle: BillingCycle;
  proratedCredit: number;
  newPlanCost: number;
  amountDue: number;
  effectiveDate: Date;
}

/**
 * Billing service interface
 */
export interface IBillingService {
  /**
   * Process a payment
   */
  processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResult>;

  /**
   * Handle payment failure
   */
  handlePaymentFailure(userId: string, reason: string): Promise<void>;

  /**
   * Handle successful payment
   */
  handlePaymentSuccess(userId: string, paymentId: string): Promise<void>;

  /**
   * Calculate plan change cost
   */
  calculatePlanChange(
    userId: string,
    newPlan: SubscriptionPlan,
    newBillingCycle?: BillingCycle
  ): Promise<PlanChangeCalculation>;

  /**
   * Get billing cycle info
   */
  getBillingCycleInfo(userId: string): Promise<BillingCycleInfo>;

  /**
   * Process subscription renewal
   */
  processRenewal(userId: string): Promise<ProcessPaymentResult>;

  /**
   * Get payment history
   */
  getPaymentHistory(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<PaymentRecord[]>;

  /**
   * Retry failed payment
   */
  retryFailedPayment(userId: string): Promise<ProcessPaymentResult>;

  /**
   * Check for subscriptions needing renewal
   */
  checkPendingRenewals(): Promise<string[]>;
}
