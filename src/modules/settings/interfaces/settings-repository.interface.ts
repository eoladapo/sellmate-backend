import { UserSettings } from '../entities';

/**
 * Settings repository interface
 */
export interface ISettingsRepository {
  /**
   * Find settings by user ID
   */
  findByUserId(userId: string): Promise<UserSettings | null>;

  /**
   * Create new settings for a user
   */
  create(userId: string, data?: Partial<UserSettings>): Promise<UserSettings>;

  /**
   * Update user settings
   */
  update(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;

  /**
   * Delete user settings
   */
  delete(userId: string): Promise<boolean>;

  /**
   * Get or create settings for a user
   */
  getOrCreate(userId: string): Promise<UserSettings>;
}
