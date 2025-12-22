import { Repository, DataSource, LessThan } from 'typeorm';
import { Subscription, PLAN_LIMITS, PLAN_PRICING } from '../entities';
import { ISubscriptionRepository } from '../interfaces';
import { SubscriptionPlan, SubscriptionStatus, BillingCycle } from '../enums';

/**
 * Subscription repository implementation
 */
export class SubscriptionRepository implements ISubscriptionRepository {
  private repository: Repository<Subscription>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Subscription);
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(userId: string, data?: Partial<Subscription>): Promise<Subscription> {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = this.repository.create({
      userId,
      plan: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.TRIAL,
      billingCycle: BillingCycle.MONTHLY,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEnd,
      usageLimits: PLAN_LIMITS[SubscriptionPlan.STARTER],
      currentUsage: {
        conversations: 0,
        orders: 0,
        customers: 0,
        integrations: 0,
        aiRequestsThisMonth: 0,
        storageUsedGB: 0,
        lastResetDate: now,
      },
      amount: PLAN_PRICING[SubscriptionPlan.STARTER].monthly,
      currency: 'NGN',
      paymentMethods: [],
      failedPaymentCount: 0,
      ...data,
    });

    return this.repository.save(subscription);
  }

  async update(userId: string, data: Partial<Subscription>): Promise<Subscription> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new Error(`Subscription not found for user ${userId}`);
    }

    const updated = this.repository.merge(existing, data);
    return this.repository.save(updated);
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId });
    return (result.affected ?? 0) > 0;
  }

  async getOrCreate(userId: string): Promise<Subscription> {
    let subscription = await this.findByUserId(userId);
    if (!subscription) {
      subscription = await this.create(userId);
    }
    return subscription;
  }

  async findExpiringSoon(days: number): Promise<Subscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.repository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: LessThan(futureDate),
      },
    });
  }

  async findPastDue(): Promise<Subscription[]> {
    return this.repository.find({
      where: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });
  }

  async findTrialsEndingSoon(days: number): Promise<Subscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.repository.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEnd: LessThan(futureDate),
      },
    });
  }

  async findActiveSubscriptions(): Promise<Subscription[]> {
    return this.repository.find({
      where: [
        { status: SubscriptionStatus.ACTIVE },
        { status: SubscriptionStatus.TRIAL },
      ],
    });
  }
}
