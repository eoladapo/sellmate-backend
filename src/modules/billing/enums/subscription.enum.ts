/**
 * Subscription plan types
 */
export enum SubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

/**
 * Payment method types
 */
export enum PaymentMethodType {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Billing cycle
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}
