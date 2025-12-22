import { Platform, MessageType, MessageDirection, MessageStatus } from '../enums';

/**
 * Unified message structure across platforms
 */
export interface IntegrationMessage {
  id: string;
  platformMessageId: string;
  platform: Platform;
  conversationId?: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  content: string;
  type: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  timestamp: Date;
  metadata?: MessageMetadata;
}

/**
 * Message metadata for additional platform-specific data
 */
export interface MessageMetadata {
  // Media attachments
  mediaUrl?: string;
  mediaCaption?: string;

  // Reply context
  replyToMessageId?: string;

  // Platform-specific
  whatsappMessageType?: string;
  instagramMessageType?: string;
}

/**
 * Message send request
 */
export interface SendMessageRequest {
  recipientId: string;
  content: string;
  type: MessageType;
  metadata?: Partial<MessageMetadata>;
  replyToMessageId?: string;
}

/**
 * Message send response
 */
export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  platformMessageId?: string;
  timestamp?: Date;
  error?: string;
}
