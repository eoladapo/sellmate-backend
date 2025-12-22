/**
 * Subscription plan types
 */
export enum SubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
}

/**
 * Subscription status (simplified for MVP)
 * - TRIAL: Initial trial period
 * - ACTIVE: Paid and active subscription
 * - CANCELLED: User cancelled, access until period end
 * - PAST_DUE: Payment failed, needs attention
 */
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

/**
 * Billing cycle
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}
