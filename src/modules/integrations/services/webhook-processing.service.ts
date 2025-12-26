import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../../di/tokens';
import { Platform } from '../enums';
import {
  IntegrationMessage,
  WebhookPayload,
  ISellerLookupService,
  SellerInfo,
} from '../interfaces';
import {
  IWebhookProcessingService,
  WebhookProcessingResult,
  ProcessingError,
} from '../interfaces/webhook-processing-service.interface';
import { IMessageSyncService, IncomingMessage } from '../../conversations/interfaces';
import { executeWithRetry, RetryConfig } from '../../../shared/utils/retry.util';

/**
 * Error codes for categorizing processing errors
 */
export enum WebhookErrorCode {
  SELLER_NOT_FOUND = 'SELLER_NOT_FOUND',
  DUPLICATE_MESSAGE = 'DUPLICATE_MESSAGE',
  MESSAGE_STORAGE_FAILED = 'MESSAGE_STORAGE_FAILED',
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Non-retryable error codes
 */
const NON_RETRYABLE_ERRORS = [
  WebhookErrorCode.SELLER_NOT_FOUND,
  WebhookErrorCode.DUPLICATE_MESSAGE,
  WebhookErrorCode.INVALID_PAYLOAD,
];

/**
 * Retry configuration for database operations
 */
const DB_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'DB_DEADLOCK',
    'ER_LOCK_DEADLOCK',
    'ER_LOCK_WAIT_TIMEOUT',
  ],
};

/**
 * WebhookProcessingService
 * Central orchestrator for webhook message processing
 * Handles seller lookup, message storage, AI analysis, and error aggregation
 * Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3
 */
@injectable()
export class WebhookProcessingService implements IWebhookProcessingService {
  constructor(
    @inject(TOKENS.SellerLookupService)
    private sellerLookupService: ISellerLookupService,
    @inject(TOKENS.MessageSyncService)
    private messageSyncService: IMessageSyncService
  ) { }

  /**
   * Process incoming webhook payload
   * Orchestrates the full flow: seller lookup -> duplicate check -> message processing
   * Requirements: 1.1, 1.2, 6.1, 6.2, 6.3
   */
  async processWebhook(
    platform: Platform,
    payload: WebhookPayload,
    parsedMessages: IntegrationMessage[]
  ): Promise<WebhookProcessingResult> {
    const result: WebhookProcessingResult = {
      success: true,
      messagesProcessed: 0,
      messagesStored: 0,
      ordersDetected: 0,
      errors: [],
    };

    if (!parsedMessages || parsedMessages.length === 0) {
      return result;
    }

    // Extract business account ID from payload for seller lookup
    const businessAccountId = this.extractBusinessAccountId(platform, payload);

    if (!businessAccountId) {
      this.logError('No business account ID found in webhook payload', {
        platform,
        payloadKeys: Object.keys(payload.body || {}),
      });
      result.success = false;
      result.errors.push({
        error: 'No business account ID found in webhook payload',
        errorCode: WebhookErrorCode.INVALID_PAYLOAD,
        retryable: false,
      });
      return result;
    }

    // Look up seller by business account ID
    // Requirements: 6.1, 6.2
    const sellerInfo = await this.lookupSeller(platform, businessAccountId);

    if (!sellerInfo) {
      // Requirements: 6.3 - Log warning and acknowledge webhook without processing
      this.logWarning('No matching seller found for webhook', {
        platform,
        businessAccountId,
      });
      // Return success to acknowledge webhook (prevent retries)
      // but don't process messages
      return result;
    }

    // Process each message
    for (const message of parsedMessages) {
      result.messagesProcessed++;

      try {
        const messageResult = await this.processMessage(
          sellerInfo,
          platform,
          message
        );

        if (messageResult.stored) {
          result.messagesStored++;
        }
        if (messageResult.orderDetected) {
          result.ordersDetected++;
        }
        if (messageResult.error) {
          result.errors.push(messageResult.error);
          if (!messageResult.error.retryable) {
            result.success = false;
          }
        }
      } catch (error) {
        const processingError = this.createProcessingError(
          error,
          message.platformMessageId
        );
        result.errors.push(processingError);

        this.logError('Failed to process message', {
          platform,
          messageId: message.platformMessageId,
          userId: sellerInfo.userId,
          error: processingError.error,
          errorCode: processingError.errorCode,
        });
      }
    }

    return result;
  }

  /**
   * Process a single message with duplicate detection and retry logic
   * Requirements: 5.2, 5.4
   */
  private async processMessage(
    sellerInfo: SellerInfo,
    platform: Platform,
    message: IntegrationMessage
  ): Promise<{
    stored: boolean;
    orderDetected: boolean;
    error?: ProcessingError;
  }> {
    // Check for duplicate message
    // Requirements: 5.4
    const isDuplicate = await this.isDuplicateMessage(
      platform,
      message.platformMessageId
    );

    if (isDuplicate) {
      this.logInfo('Skipping duplicate message', {
        platform,
        platformMessageId: message.platformMessageId,
      });
      return {
        stored: false,
        orderDetected: false,
      };
    }

    // Convert IntegrationMessage to IncomingMessage format
    const incomingMessage: IncomingMessage = {
      platformMessageId: message.platformMessageId,
      platformConversationId: message.conversationId || message.senderId,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.timestamp,
      messageType: message.type,
      metadata: message.metadata,
    };

    // Process message with retry for transient failures
    // Requirements: 5.2
    const retryResult = await executeWithRetry(
      async () => {
        const processedMessages = await this.messageSyncService.processIncomingMessagesWithAI(
          sellerInfo.userId,
          platform,
          [incomingMessage]
        );
        return processedMessages;
      },
      DB_RETRY_CONFIG
    );

    if (!retryResult.success) {
      return {
        stored: false,
        orderDetected: false,
        error: {
          messageId: message.id,
          platformMessageId: message.platformMessageId,
          error: retryResult.error?.message || 'Message storage failed',
          errorCode: WebhookErrorCode.MESSAGE_STORAGE_FAILED,
          retryable: true,
          context: {
            attempts: retryResult.attempts,
            totalDelayMs: retryResult.totalDelayMs,
          },
        },
      };
    }

    const processedMessages = retryResult.data || [];
    const processedMessage = processedMessages[0];

    // Check if order was detected
    const orderDetected = processedMessage?.aiAnalysis?.orderDetected || false;

    return {
      stored: processedMessages.length > 0,
      orderDetected,
    };
  }

  /**
   * Check if a message is a duplicate
   * Requirements: 5.4
   */
  async isDuplicateMessage(
    platform: Platform,
    platformMessageId: string
  ): Promise<boolean> {
    return this.messageSyncService.isDuplicateMessage(platform, platformMessageId);
  }

  /**
   * Look up seller by platform and business account ID
   * Requirements: 6.1, 6.2
   */
  private async lookupSeller(
    platform: Platform,
    businessAccountId: string
  ): Promise<SellerInfo | null> {
    if (platform === Platform.WHATSAPP) {
      return this.sellerLookupService.findByWhatsAppPhoneNumberId(businessAccountId);
    } else if (platform === Platform.INSTAGRAM) {
      return this.sellerLookupService.findByInstagramAccountId(businessAccountId);
    }
    return null;
  }

  /**
   * Extract business account ID from webhook payload
   * For WhatsApp: phone_number_id
   * For Instagram: recipient.id or page_id
   */
  private extractBusinessAccountId(
    platform: Platform,
    payload: WebhookPayload
  ): string | null {
    const body = payload.body as Record<string, unknown>;

    if (platform === Platform.WHATSAPP) {
      // WhatsApp webhook structure: entry[].changes[].value.metadata.phone_number_id
      return this.extractWhatsAppPhoneNumberId(body);
    } else if (platform === Platform.INSTAGRAM) {
      // Instagram webhook structure: entry[].messaging[].recipient.id
      return this.extractInstagramAccountId(body);
    }

    return null;
  }

  /**
   * Extract phone_number_id from WhatsApp webhook payload
   */
  private extractWhatsAppPhoneNumberId(body: Record<string, unknown>): string | null {
    try {
      const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
      const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const value = changes?.value as Record<string, unknown>;
      const metadata = value?.metadata as Record<string, unknown>;
      return (metadata?.phone_number_id as string) || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract Instagram account ID from webhook payload
   */
  private extractInstagramAccountId(body: Record<string, unknown>): string | null {
    try {
      const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
      const messaging = (entry?.messaging as Array<Record<string, unknown>>)?.[0];
      const recipient = messaging?.recipient as Record<string, unknown>;
      return (recipient?.id as string) || (entry?.id as string) || null;
    } catch {
      return null;
    }
  }

  /**
   * Create a ProcessingError from an exception
   * Requirements: 5.1, 5.3
   */
  private createProcessingError(
    error: unknown,
    platformMessageId?: string
  ): ProcessingError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.categorizeError(error);
    const retryable = !NON_RETRYABLE_ERRORS.includes(errorCode);

    return {
      platformMessageId,
      error: errorMessage,
      errorCode,
      retryable,
    };
  }

  /**
   * Categorize an error into an error code
   * Requirements: 5.3
   */
  private categorizeError(error: unknown): WebhookErrorCode {
    if (!(error instanceof Error)) {
      return WebhookErrorCode.UNKNOWN_ERROR;
    }

    const message = error.message.toLowerCase();
    const code = (error as NodeJS.ErrnoException).code;

    if (message.includes('duplicate') || message.includes('already exists')) {
      return WebhookErrorCode.DUPLICATE_MESSAGE;
    }

    if (message.includes('seller not found') || message.includes('no matching seller')) {
      return WebhookErrorCode.SELLER_NOT_FOUND;
    }

    if (message.includes('invalid') || message.includes('malformed')) {
      return WebhookErrorCode.INVALID_PAYLOAD;
    }

    if (
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      message.includes('database') ||
      message.includes('connection')
    ) {
      return WebhookErrorCode.DATABASE_ERROR;
    }

    if (message.includes('ai') || message.includes('analysis')) {
      return WebhookErrorCode.AI_ANALYSIS_FAILED;
    }

    return WebhookErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Log an error with full context
   * Requirements: 5.1
   */
  private logError(message: string, context: Record<string, unknown>): void {
    console.error(`[WebhookProcessingService] ERROR: ${message}`, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Log a warning
   */
  private logWarning(message: string, context: Record<string, unknown>): void {
    console.warn(`[WebhookProcessingService] WARN: ${message}`, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Log info
   */
  private logInfo(message: string, context: Record<string, unknown>): void {
    console.log(`[WebhookProcessingService] INFO: ${message}`, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}
