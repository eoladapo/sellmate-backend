import { Subscription } from '../entities';

/**
 * Subscription repository interface (simplified for MVP)
 */
export interface ISubscriptionRepository {
  /**
   * Find subscription by user ID
   */
  findByUserId(userId: string): Promise<Subscription | null>;

  /**
   * Find subscription by ID
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * Create a new subscription
   */
  create(userId: string, data?: Partial<Subscription>): Promise<Subscription>;

  /**
   * Update subscription
   */
  update(userId: string, data: Partial<Subscription>): Promise<Subscription>;

  /**
   * Delete subscription
   */
  delete(userId: string): Promise<boolean>;

  /**
   * Get or create subscription for user
   */
  getOrCreate(userId: string): Promise<Subscription>;
}
