import { Platform, ConnectionStatus } from '../enums';

/**
 * Integration configuration for a platform
 */
export interface IntegrationConfig {
  platform: Platform;
  userId: string;
  businessAccountId: string;
  businessAccountName?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  webhookUrl?: string;
  webhookVerifyToken?: string;
  settings?: IntegrationSettings;
}

/**
 * Platform-specific integration settings
 */
export interface IntegrationSettings {
  autoSync: boolean;
  syncIntervalMinutes: number;
  syncComments?: boolean; // Instagram-specific
  notifyOnNewMessage: boolean;
  notifyOnStatusChange: boolean;
}

/**
 * Integration connection status
 */
export interface IntegrationStatus {
  platform: Platform;
  status: ConnectionStatus;
  businessAccountId?: string;
  businessAccountName?: string;
  connectedAt?: Date;
  lastSyncAt?: Date;
  lastError?: string;
  lastErrorAt?: Date;
  tokenExpiresAt?: Date;
  isTokenExpiringSoon?: boolean;
  messageCount?: number;
  conversationCount?: number;
}

/**
 * Integration health check result
 */
export interface IntegrationHealthCheck {
  platform: Platform;
  isHealthy: boolean;
  apiReachable: boolean;
  tokenValid: boolean;
  webhookConfigured: boolean;
  lastCheckAt: Date;
  details?: Record<string, unknown>;
  errors?: string[];
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  platform: Platform;
  limit: number;
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}
