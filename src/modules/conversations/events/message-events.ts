/**
 * Message Event Interfaces and Types
 * Defines event structures for real-time notifications
 * Requirements: 4.1, 4.2, 4.3
 */

import { Platform } from '../../integrations/enums';
import { LastMessageSummary } from '../entities/conversation.entity';
import { IExtractedOrderDetails, IResponseSuggestion } from '../../ai/interfaces';

/**
 * Base event interface for all message-related events
 */
export interface BaseMessageEvent {
  conversationId: string;
  messageId: string;
  platform: Platform;
  timestamp: Date;
}

/**
 * Event emitted when a new message is received and stored
 * Requirements: 4.1, 4.3
 */
export interface NewMessageEvent extends BaseMessageEvent {
  messagePreview: string;
  senderName?: string;
  orderDetected: boolean;
}

/**
 * Event emitted when an order is detected in a message (priority notification)
 * Requirements: 4.2
 */
export interface OrderDetectedEvent extends NewMessageEvent {
  extractedDetails?: IExtractedOrderDetails;
  confidence: number;
  suggestedResponses?: IResponseSuggestion[];
}

/**
 * Event emitted when a conversation is updated
 * Requirements: 4.3
 */
export interface ConversationUpdatedEvent {
  conversationId: string;
  unreadCount: number;
  lastMessage: LastMessageSummary;
  hasOrderDetected: boolean;
}

/**
 * Event types for the message event emitter
 */
export enum MessageEventType {
  NEW_MESSAGE = 'new_message',
  ORDER_DETECTED = 'order_detected',
  CONVERSATION_UPDATED = 'conversation_updated',
}

/**
 * Interface for the message event emitter service
 */
export interface IMessageEventEmitter {
  /**
   * Emit new message event
   */
  emitNewMessage(userId: string, event: NewMessageEvent): void;

  /**
   * Emit order detected event (priority)
   */
  emitOrderDetected(userId: string, event: OrderDetectedEvent): void;

  /**
   * Emit conversation updated event
   */
  emitConversationUpdated(userId: string, event: ConversationUpdatedEvent): void;
}
