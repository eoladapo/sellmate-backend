import { Platform } from '../enums';
import { IntegrationMessage, WebhookPayload } from './index';
import { IExtractedOrderDetails, IResponseSuggestion } from '../../ai/interfaces';

/**
 * Result of processing a webhook
 */
export interface WebhookProcessingResult {
  success: boolean;
  messagesProcessed: number;
  messagesStored: number;
  ordersDetected: number;
  errors: ProcessingError[];
}

/**
 * Result of processing a single message
 */
export interface MessageProcessingResult {
  messageId: string;
  conversationId: string;
  orderDetected: boolean;
  aiAnalysis?: {
    confidence: number;
    customerIntent?: string;
    extractedDetails?: IExtractedOrderDetails;
    suggestedResponses?: IResponseSuggestion[];
  };
}

/**
 * Processing error with context
 */
export interface ProcessingError {
  messageId?: string;
  platformMessageId?: string;
  error: string;
  errorCode?: string;
  retryable: boolean;
  context?: Record<string, unknown>;
}

/**
 * Interface for WebhookProcessingService
 * Central orchestrator for webhook message processing
 * Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3
 */
export interface IWebhookProcessingService {
  /**
   * Process incoming webhook payload
   * Orchestrates seller lookup, message storage, AI analysis, and event emission
   * @param platform - The platform (whatsapp or instagram)
   * @param payload - Raw webhook payload
   * @param parsedMessages - Messages parsed from the webhook payload
   * @returns WebhookProcessingResult with success status and error details
   */
  processWebhook(
    platform: Platform,
    payload: WebhookPayload,
    parsedMessages: IntegrationMessage[]
  ): Promise<WebhookProcessingResult>;

  /**
   * Check if a message is a duplicate
   * @param platform - The platform
   * @param platformMessageId - The platform-specific message ID
   * @returns true if the message already exists
   */
  isDuplicateMessage(platform: Platform, platformMessageId: string): Promise<boolean>;
}
