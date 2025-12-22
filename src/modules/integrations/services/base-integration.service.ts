import { Platform, ConnectionStatus } from '../enums';
import {
  IIntegrationService,
  IntegrationConfig,
  IntegrationStatus,
  IntegrationHealthCheck,
  RateLimitInfo,
  SendMessageRequest,
  SendMessageResponse,
  IntegrationMessage,
  WebhookPayload,
  WebhookVerificationResult,
  SyncOptions,
  SyncResult,
} from '../interfaces';

/**
 * Base integration service providing common functionality
 * Platform-specific services should extend this class
 */
export abstract class BaseIntegrationService implements IIntegrationService {
  abstract readonly platform: Platform;

  protected config: IntegrationConfig | null = null;
  protected connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  protected lastSyncAt: Date | null = null;
  protected lastError: string | null = null;
  protected lastErrorAt: Date | null = null;

  // Rate limiting state
  protected rateLimitRemaining: number = 1000;
  protected rateLimitResetAt: Date = new Date();
  protected isRateLimited: boolean = false;

  // Retry configuration
  protected readonly maxRetries: number = 3;
  protected readonly baseRetryDelayMs: number = 1000;
  protected readonly maxRetryDelayMs: number = 30000;

  /**
   * Initialize the integration with configuration
   */
  async initialize(config: IntegrationConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;
    this.connectionStatus = ConnectionStatus.PENDING;

    try {
      await this.performInitialization();
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.lastError = null;
      this.lastErrorAt = null;
    } catch (error) {
      this.connectionStatus = ConnectionStatus.ERROR;
      this.lastError = error instanceof Error ? error.message : 'Initialization failed';
      this.lastErrorAt = new Date();
      throw error;
    }
  }

  /**
   * Platform-specific initialization logic
   */
  protected abstract performInitialization(): Promise<void>;

  /**
   * Check if the integration is properly configured
   */
  isConfigured(): boolean {
    return (
      this.config !== null &&
      !!this.config.accessToken &&
      !!this.config.businessAccountId
    );
  }

  /**
   * Get current connection status
   */
  async getStatus(): Promise<IntegrationStatus> {
    const tokenExpiresAt = this.config?.tokenExpiresAt;
    const isTokenExpiringSoon = tokenExpiresAt
      ? tokenExpiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000 // 24 hours
      : false;

    return {
      platform: this.platform,
      status: this.connectionStatus,
      businessAccountId: this.config?.businessAccountId,
      businessAccountName: this.config?.businessAccountName,
      connectedAt: this.config ? new Date() : undefined,
      lastSyncAt: this.lastSyncAt ?? undefined,
      lastError: this.lastError ?? undefined,
      lastErrorAt: this.lastErrorAt ?? undefined,
      tokenExpiresAt,
      isTokenExpiringSoon,
    };
  }

  /**
   * Perform health check on the integration
   */
  async healthCheck(): Promise<IntegrationHealthCheck> {
    const errors: string[] = [];
    let apiReachable = false;
    let tokenValid = false;
    let webhookConfigured = false;

    try {
      // Check API reachability
      apiReachable = await this.checkApiReachability();
      if (!apiReachable) {
        errors.push('API is not reachable');
      }

      // Check token validity
      tokenValid = await this.checkTokenValidity();
      if (!tokenValid) {
        errors.push('Access token is invalid or expired');
      }

      // Check webhook configuration
      webhookConfigured = await this.checkWebhookConfiguration();
      if (!webhookConfigured) {
        errors.push('Webhook is not properly configured');
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Health check failed');
    }

    const isHealthy = apiReachable && tokenValid && errors.length === 0;

    return {
      platform: this.platform,
      isHealthy,
      apiReachable,
      tokenValid,
      webhookConfigured,
      lastCheckAt: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Platform-specific API reachability check
   */
  protected abstract checkApiReachability(): Promise<boolean>;

  /**
   * Platform-specific token validity check
   */
  protected abstract checkTokenValidity(): Promise<boolean>;

  /**
   * Platform-specific webhook configuration check
   */
  protected abstract checkWebhookConfiguration(): Promise<boolean>;

  /**
   * Send a message through the platform
   */
  abstract sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;

  /**
   * Sync messages from the platform
   */
  abstract syncMessages(options?: SyncOptions): Promise<SyncResult>;

  /**
   * Verify webhook signature/token
   */
  abstract verifyWebhook(payload: WebhookPayload): WebhookVerificationResult;

  /**
   * Process incoming webhook event
   */
  abstract processWebhook(payload: WebhookPayload): Promise<IntegrationMessage[]>;

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo {
    return {
      platform: this.platform,
      limit: 1000, // Default limit, override in subclasses
      remaining: this.rateLimitRemaining,
      resetAt: this.rateLimitResetAt,
      isLimited: this.isRateLimited,
    };
  }

  /**
   * Disconnect the integration
   */
  async disconnect(): Promise<void> {
    this.config = null;
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.lastSyncAt = null;
    this.lastError = null;
    this.lastErrorAt = null;
  }

  /**
   * Refresh access token if needed
   */
  abstract refreshTokenIfNeeded(): Promise<boolean>;

  /**
   * Validate configuration
   */
  protected validateConfig(config: IntegrationConfig): void {
    if (!config.userId) {
      throw new Error('User ID is required');
    }
    if (!config.businessAccountId) {
      throw new Error('Business account ID is required');
    }
    if (!config.accessToken) {
      throw new Error('Access token is required');
    }
    if (config.platform !== this.platform) {
      throw new Error(`Invalid platform: expected ${this.platform}, got ${config.platform}`);
    }
  }

  /**
   * Update rate limit state from API response headers
   */
  protected updateRateLimitFromHeaders(headers: Record<string, string>): void {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }
    if (reset) {
      this.rateLimitResetAt = new Date(parseInt(reset, 10) * 1000);
    }

    this.isRateLimited = this.rateLimitRemaining <= 0;
  }

  /**
   * Wait for rate limit to reset
   */
  protected async waitForRateLimitReset(): Promise<void> {
    if (!this.isRateLimited) return;

    const waitTime = Math.max(0, this.rateLimitResetAt.getTime() - Date.now());
    if (waitTime > 0) {
      await this.sleep(waitTime);
    }
    this.isRateLimited = false;
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let retryDelay = this.baseRetryDelayMs;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Wait for rate limit if needed
        await this.waitForRateLimitReset();

        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Log retry attempt
        console.warn(
          `${this.platform} ${operationName} failed (attempt ${attempt}/${this.maxRetries}): ${lastError.message}. Retrying in ${retryDelay}ms...`
        );

        // Wait before retry with exponential backoff
        await this.sleep(retryDelay);
        retryDelay = Math.min(retryDelay * 2, this.maxRetryDelayMs);
      }
    }

    throw lastError || new Error(`${operationName} failed after ${this.maxRetries} attempts`);
  }

  /**
   * Check if an error is retryable
   */
  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Retry on network errors, rate limits, and temporary server errors
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      );
    }
    return false;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get access token (throws if not configured)
   */
  protected getAccessToken(): string {
    if (!this.config?.accessToken) {
      throw new Error('Integration not configured: missing access token');
    }
    return this.config.accessToken;
  }

  /**
   * Get business account ID (throws if not configured)
   */
  protected getBusinessAccountId(): string {
    if (!this.config?.businessAccountId) {
      throw new Error('Integration not configured: missing business account ID');
    }
    return this.config.businessAccountId;
  }

  /**
   * Set connection error state
   */
  protected setError(error: string): void {
    this.lastError = error;
    this.lastErrorAt = new Date();
    this.connectionStatus = ConnectionStatus.ERROR;
  }

  /**
   * Clear error state
   */
  protected clearError(): void {
    this.lastError = null;
    this.lastErrorAt = null;
    if (this.connectionStatus === ConnectionStatus.ERROR) {
      this.connectionStatus = ConnectionStatus.CONNECTED;
    }
  }

  /**
   * Update last sync timestamp
   */
  protected updateLastSync(): void {
    this.lastSyncAt = new Date();
  }
}
