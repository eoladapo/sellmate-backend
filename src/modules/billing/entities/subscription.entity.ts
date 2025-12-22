import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentMethodType,
  BillingCycle,
} from '../enums';

/**
 * Payment method details
 */
export interface PaymentMethod {
  type: PaymentMethodType;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountLast4?: string;
  mobileNumber?: string;
  provider?: string;
  isDefault: boolean;
  authorizationCode?: string; // Paystack authorization code for recurring payments
}

/**
 * Usage limits per plan
 */
export interface UsageLimits {
  maxConversations: number;
  maxOrders: number;
  maxCustomers: number;
  maxIntegrations: number;
  aiRequestsPerMonth: number;
  storageGB: number;
}

/**
 * Current usage tracking
 */
export interface CurrentUsage {
  conversations: number;
  orders: number;
  customers: number;
  integrations: number;
  aiRequestsThisMonth: number;
  storageUsedGB: number;
  lastResetDate: Date;
}

/**
 * Plan pricing configuration
 */
export const PLAN_PRICING: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
  [SubscriptionPlan.STARTER]: { monthly: 5000, yearly: 50000 },
  [SubscriptionPlan.PROFESSIONAL]: { monthly: 15000, yearly: 150000 },
  [SubscriptionPlan.BUSINESS]: { monthly: 35000, yearly: 350000 },
};

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, UsageLimits> = {
  [SubscriptionPlan.STARTER]: {
    maxConversations: 100,
    maxOrders: 50,
    maxCustomers: 100,
    maxIntegrations: 1,
    aiRequestsPerMonth: 100,
    storageGB: 1,
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    maxConversations: 500,
    maxOrders: 250,
    maxCustomers: 500,
    maxIntegrations: 2,
    aiRequestsPerMonth: 500,
    storageGB: 5,
  },
  [SubscriptionPlan.BUSINESS]: {
    maxConversations: -1, // unlimited
    maxOrders: -1, // unlimited
    maxCustomers: -1, // unlimited
    maxIntegrations: 2,
    aiRequestsPerMonth: -1, // unlimited
    storageGB: 20,
  },
};

@Entity('subscriptions')
@Index(['userId'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  @Index()
  userId!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: SubscriptionPlan.STARTER,
  })
  plan!: SubscriptionPlan;

  @Column({
    type: 'varchar',
    length: 20,
    default: SubscriptionStatus.TRIAL,
  })
  status!: SubscriptionStatus;

  @Column({
    name: 'billing_cycle',
    type: 'varchar',
    length: 10,
    default: BillingCycle.MONTHLY,
  })
  billingCycle!: BillingCycle;

  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart!: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd!: Date;

  @Column({ name: 'trial_end', type: 'timestamp', nullable: true })
  trialEnd?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'payment_methods', type: 'jsonb', default: '[]' })
  paymentMethods!: PaymentMethod[];

  @Column({ name: 'usage_limits', type: 'jsonb' })
  usageLimits!: UsageLimits;

  @Column({ name: 'current_usage', type: 'jsonb' })
  currentUsage!: CurrentUsage;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency!: string;

  @Column({ name: 'failed_payment_count', type: 'int', default: 0 })
  failedPaymentCount!: number;

  @Column({ name: 'last_payment_date', type: 'timestamp', nullable: true })
  lastPaymentDate?: Date;

  @Column({ name: 'next_payment_date', type: 'timestamp', nullable: true })
  nextPaymentDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  constructor() {
    this.plan = SubscriptionPlan.STARTER;
    this.status = SubscriptionStatus.TRIAL;
    this.billingCycle = BillingCycle.MONTHLY;
    this.paymentMethods = [];
    this.usageLimits = PLAN_LIMITS[SubscriptionPlan.STARTER];
    this.currentUsage = {
      conversations: 0,
      orders: 0,
      customers: 0,
      integrations: 0,
      aiRequestsThisMonth: 0,
      storageUsedGB: 0,
      lastResetDate: new Date(),
    };
    this.amount = PLAN_PRICING[SubscriptionPlan.STARTER].monthly;
    this.currency = 'NGN';
    this.failedPaymentCount = 0;
  }
}
