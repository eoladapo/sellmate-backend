import { Platform, WebhookEventType } from '../enums';

/**
 * Raw webhook payload from platform
 */
export interface WebhookPayload {
  platform: Platform;
  headers: Record<string, string>;
  body: unknown;
  signature?: string;
  timestamp?: number;
}

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
  challenge?: string; // For webhook verification challenges
}

/**
 * Parsed webhook event
 */
export interface WebhookEvent {
  id: string;
  platform: Platform;
  type: WebhookEventType;
  timestamp: Date;
  data: WebhookEventData;
  rawPayload: unknown;
}

/**
 * Webhook event data
 */
export interface WebhookEventData {
  // Message events
  messageId?: string;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  content?: string;
  messageType?: string;

  // Status events
  status?: string;
  statusTimestamp?: Date;

  // Error events
  errorCode?: string;
  errorMessage?: string;

  // Platform-specific data
  metadata?: Record<string, unknown>;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  platform: Platform;
  url: string;
  verifyToken: string;
  secret?: string;
  events: WebhookEventType[];
}

/**
 * Webhook registration result
 */
export interface WebhookRegistrationResult {
  success: boolean;
  webhookId?: string;
  error?: string;
}
