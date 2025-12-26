import { OAuthToken } from '../entities/oauth-token.entity';

export interface IOAuthTokenRepository {
  /**
   * Find OAuth token by user ID and platform
   */
  findByUserAndPlatform(
    userId: string,
    platform: 'whatsapp' | 'instagram'
  ): Promise<OAuthToken | null>;

  /**
   * Find active OAuth token by business account ID and platform
   * Used to identify sellers from webhook payloads
   */
  findByBusinessAccountId(
    platform: 'whatsapp' | 'instagram',
    businessAccountId: string
  ): Promise<OAuthToken | null>;

  /**
   * Create or update OAuth token
   */
  upsert(tokenData: {
    userId: string;
    platform: 'whatsapp' | 'instagram';
    encryptedAccessToken: string;
    encryptedRefreshToken?: string;
    businessAccountId?: string;
    businessAccountName?: string;
    scope?: string;
    expiresAt?: Date;
  }): Promise<OAuthToken>;

  /**
   * Update OAuth token
   */
  update(id: string, updates: Partial<OAuthToken>): Promise<OAuthToken | null>;

  /**
   * Delete OAuth token
   */
  delete(userId: string, platform: 'whatsapp' | 'instagram'): Promise<boolean>;

  /**
   * Find all active tokens for a user
   */
  findActiveTokensByUser(userId: string): Promise<OAuthToken[]>;

  /**
   * Deactivate token
   */
  deactivate(userId: string, platform: 'whatsapp' | 'instagram'): Promise<boolean>;
}
