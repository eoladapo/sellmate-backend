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
  BillingCycle,
} from '../enums';

/**
 * Plan pricing configuration
 */
export const PLAN_PRICING: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
  [SubscriptionPlan.STARTER]: { monthly: 5000, yearly: 50000 },
  [SubscriptionPlan.PROFESSIONAL]: { monthly: 15000, yearly: 150000 },
  [SubscriptionPlan.BUSINESS]: { monthly: 35000, yearly: 350000 },
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

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency!: string;

  // Paystack authorization for recurring charges
  @Column({ name: 'paystack_authorization_code', type: 'varchar', nullable: true })
  paystackAuthorizationCode?: string;

  @Column({ name: 'paystack_customer_code', type: 'varchar', nullable: true })
  paystackCustomerCode?: string;

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
    this.amount = PLAN_PRICING[SubscriptionPlan.STARTER].monthly;
    this.currency = 'NGN';
  }
}
