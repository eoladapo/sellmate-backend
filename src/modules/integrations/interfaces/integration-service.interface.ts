import { Platform } from '../enums';
import {
  IntegrationConfig,
  IntegrationStatus,
  IntegrationHealthCheck,
  RateLimitInfo,
} from './integration-config.interface';
import {
  IntegrationMessage,
  SendMessageRequest,
  SendMessageResponse,
} from './integration-message.interface';
import { WebhookPayload, WebhookVerificationResult } from './webhook.interface';
import { SyncResult, SyncOptions } from './sync.interface';

/**
 * Base integration service interface
 * All platform-specific integrations must implement this interface
 */
export interface IIntegrationService {
  /**
   * Get the platform this service handles
   */
  readonly platform: Platform;

  /**
   * Initialize the integration with configuration
   */
  initialize(config: IntegrationConfig): Promise<void>;

  /**
   * Check if the integration is properly configured
   */
  isConfigured(): boolean;

  /**
   * Get current connection status
   */
  getStatus(): Promise<IntegrationStatus>;

  /**
   * Perform health check on the integration
   */
  healthCheck(): Promise<IntegrationHealthCheck>;

  /**
   * Send a message through the platform
   */
  sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;

  /**
   * Sync messages from the platform
   */
  syncMessages(options?: SyncOptions): Promise<SyncResult>;

  /**
   * Verify webhook signature/token
   */
  verifyWebhook(payload: WebhookPayload): WebhookVerificationResult;

  /**
   * Process incoming webhook event
   */
  processWebhook(payload: WebhookPayload): Promise<IntegrationMessage[]>;

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo;

  /**
   * Disconnect the integration
   */
  disconnect(): Promise<void>;

  /**
   * Refresh access token if needed
   */
  refreshTokenIfNeeded(): Promise<boolean>;
}

/**
 * Integration service factory interface
 */
export interface IIntegrationServiceFactory {
  /**
   * Create an integration service for a specific platform
   */
  create(platform: Platform, config: IntegrationConfig): IIntegrationService;

  /**
   * Get all supported platforms
   */
  getSupportedPlatforms(): Platform[];
}
