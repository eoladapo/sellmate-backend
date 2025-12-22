import { Platform, ConnectionStatus } from '../enums';
import {
  IIntegrationService,
  IntegrationConfig,
  IntegrationStatus,
  IntegrationHealthCheck,
  SendMessageRequest,
  SendMessageResponse,
  SyncOptions,
  SyncResult,
} from '../interfaces';

/**
 * Integration Manager Service
 * Manages multiple platform integrations for a user
 */
export class IntegrationManagerService {
  private integrations: Map<Platform, IIntegrationService> = new Map();
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Register an integration service for a platform
   */
  registerIntegration(service: IIntegrationService): void {
    this.integrations.set(service.platform, service);
  }

  /**
   * Get integration service for a platform
   */
  getIntegration(platform: Platform): IIntegrationService | undefined {
    return this.integrations.get(platform);
  }

  /**
   * Check if a platform is connected
   */
  isConnected(platform: Platform): boolean {
    const integration = this.integrations.get(platform);
    return integration?.isConfigured() ?? false;
  }

  /**
   * Get all connected platforms
   */
  getConnectedPlatforms(): Platform[] {
    const connected: Platform[] = [];
    for (const [platform, integration] of this.integrations) {
      if (integration.isConfigured()) {
        connected.push(platform);
      }
    }
    return connected;
  }

  /**
   * Initialize an integration with configuration
   */
  async initializeIntegration(
    platform: Platform,
    config: IntegrationConfig
  ): Promise<void> {
    const integration = this.integrations.get(platform);
    if (!integration) {
      throw new Error(`No integration service registered for platform: ${platform}`);
    }

    await integration.initialize(config);
  }

  /**
   * Get status of all integrations
   */
  async getAllStatuses(): Promise<IntegrationStatus[]> {
    const statuses: IntegrationStatus[] = [];

    for (const [platform, integration] of this.integrations) {
      try {
        const status = await integration.getStatus();
        statuses.push(status);
      } catch (error) {
        statuses.push({
          platform,
          status: ConnectionStatus.ERROR,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          lastErrorAt: new Date(),
        });
      }
    }

    return statuses;
  }

  /**
   * Get status of a specific platform
   */
  async getStatus(platform: Platform): Promise<IntegrationStatus> {
    const integration = this.integrations.get(platform);
    if (!integration) {
      return {
        platform,
        status: ConnectionStatus.DISCONNECTED,
      };
    }

    return integration.getStatus();
  }

  /**
   * Perform health check on all integrations
   */
  async healthCheckAll(): Promise<IntegrationHealthCheck[]> {
    const results: IntegrationHealthCheck[] = [];

    for (const [platform, integration] of this.integrations) {
      try {
        const health = await integration.healthCheck();
        results.push(health);
      } catch (error) {
        results.push({
          platform,
          isHealthy: false,
          apiReachable: false,
          tokenValid: false,
          webhookConfigured: false,
          lastCheckAt: new Date(),
          errors: [error instanceof Error ? error.message : 'Health check failed'],
        });
      }
    }

    return results;
  }

  /**
   * Perform health check on a specific platform
   */
  async healthCheck(platform: Platform): Promise<IntegrationHealthCheck> {
    const integration = this.integrations.get(platform);
    if (!integration) {
      return {
        platform,
        isHealthy: false,
        apiReachable: false,
        tokenValid: false,
        webhookConfigured: false,
        lastCheckAt: new Date(),
        errors: ['Integration not registered'],
      };
    }

    return integration.healthCheck();
  }

  /**
   * Send a message through a specific platform
   */
  async sendMessage(
    platform: Platform,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const integration = this.integrations.get(platform);
    if (!integration) {
      return {
        success: false,
        error: `Integration not available for platform: ${platform}`,
      };
    }

    if (!integration.isConfigured()) {
      return {
        success: false,
        error: `Integration not configured for platform: ${platform}`,
      };
    }

    return integration.sendMessage(request);
  }

  /**
   * Sync messages from a specific platform
   */
  async syncMessages(platform: Platform, options?: SyncOptions): Promise<SyncResult> {
    const integration = this.integrations.get(platform);
    if (!integration) {
      return {
        platform,
        success: false,
        messagesCount: 0,
        conversationsCount: 0,
        messages: [],
        newConversations: [],
        lastSyncTimestamp: new Date(),
        hasMore: false,
        errors: [{ code: 'NOT_REGISTERED', message: 'Integration not registered', retryable: false }],
      };
    }

    if (!integration.isConfigured()) {
      return {
        platform,
        success: false,
        messagesCount: 0,
        conversationsCount: 0,
        messages: [],
        newConversations: [],
        lastSyncTimestamp: new Date(),
        hasMore: false,
        errors: [{ code: 'NOT_CONFIGURED', message: 'Integration not configured', retryable: false }],
      };
    }

    return integration.syncMessages(options);
  }

  /**
   * Sync messages from all connected platforms
   */
  async syncAllMessages(options?: SyncOptions): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const [platform, integration] of this.integrations) {
      if (integration.isConfigured()) {
        try {
          const result = await integration.syncMessages(options);
          results.push(result);
        } catch (error) {
          results.push({
            platform,
            success: false,
            messagesCount: 0,
            conversationsCount: 0,
            messages: [],
            newConversations: [],
            lastSyncTimestamp: new Date(),
            hasMore: false,
            errors: [{
              code: 'SYNC_ERROR',
              message: error instanceof Error ? error.message : 'Sync failed',
              retryable: true,
            }],
          });
        }
      }
    }

    return results;
  }

  /**
   * Disconnect a specific platform
   */
  async disconnect(platform: Platform): Promise<void> {
    const integration = this.integrations.get(platform);
    if (integration) {
      await integration.disconnect();
    }
  }

  /**
   * Disconnect all platforms
   */
  async disconnectAll(): Promise<void> {
    for (const integration of this.integrations.values()) {
      await integration.disconnect();
    }
  }

  /**
   * Refresh tokens for all integrations that need it
   */
  async refreshAllTokens(): Promise<Map<Platform, boolean>> {
    const results = new Map<Platform, boolean>();

    for (const [platform, integration] of this.integrations) {
      if (integration.isConfigured()) {
        try {
          const refreshed = await integration.refreshTokenIfNeeded();
          results.set(platform, refreshed);
        } catch (error) {
          console.error(`Token refresh failed for ${platform}:`, error);
          results.set(platform, false);
        }
      }
    }

    return results;
  }

  /**
   * Get user ID
   */
  getUserId(): string {
    return this.userId;
  }
}
