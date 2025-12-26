/**
 * EventEmitter Service for real-time message notifications
 * Uses Node.js EventEmitter as base, integrates with SocketService for WebSocket delivery
 * Requirements: 4.1, 4.2, 4.3
 */

import { EventEmitter } from 'events';
import { injectable } from 'tsyringe';
import {
  IMessageEventEmitter,
  NewMessageEvent,
  OrderDetectedEvent,
  ConversationUpdatedEvent,
  MessageEventType,
} from './message-events';
import { getSocketService } from '../../../shared/services/socket.service';

/**
 * EventEmitterService
 * Handles emission of message-related events for real-time notifications
 */
@injectable()
export class EventEmitterService extends EventEmitter implements IMessageEventEmitter {
  private static instance: EventEmitterService | null = null;

  constructor() {
    super();
    // Increase max listeners to handle multiple subscribers
    this.setMaxListeners(100);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventEmitterService {
    if (!EventEmitterService.instance) {
      EventEmitterService.instance = new EventEmitterService();
    }
    return EventEmitterService.instance;
  }

  /**
   * Emit new message event
   * Requirements: 4.1, 4.3
   */
  emitNewMessage(userId: string, event: NewMessageEvent): void {
    // Emit locally for internal subscribers
    this.emit(MessageEventType.NEW_MESSAGE, { userId, ...event });

    // Send via WebSocket to connected clients
    this.sendToSocket(userId, MessageEventType.NEW_MESSAGE, event);

    console.log(
      `📨 New message event emitted for user ${userId}, conversation ${event.conversationId}`
    );
  }

  /**
   * Emit order detected event (priority notification)
   * Requirements: 4.2
   */
  emitOrderDetected(userId: string, event: OrderDetectedEvent): void {
    // Emit locally for internal subscribers
    this.emit(MessageEventType.ORDER_DETECTED, { userId, ...event });

    // Send via WebSocket to connected clients with priority flag
    this.sendToSocket(userId, MessageEventType.ORDER_DETECTED, {
      ...event,
      priority: true,
    });

    console.log(
      `🛒 Order detected event emitted for user ${userId}, conversation ${event.conversationId}, confidence: ${event.confidence}`
    );
  }

  /**
   * Emit conversation updated event
   * Requirements: 4.3
   */
  emitConversationUpdated(userId: string, event: ConversationUpdatedEvent): void {
    // Emit locally for internal subscribers
    this.emit(MessageEventType.CONVERSATION_UPDATED, { userId, ...event });

    // Send via WebSocket to connected clients
    this.sendToSocket(userId, MessageEventType.CONVERSATION_UPDATED, event);

    console.log(
      `💬 Conversation updated event emitted for user ${userId}, conversation ${event.conversationId}`
    );
  }

  /**
   * Subscribe to new message events
   */
  onNewMessage(callback: (data: { userId: string } & NewMessageEvent) => void): void {
    this.on(MessageEventType.NEW_MESSAGE, callback);
  }

  /**
   * Subscribe to order detected events
   */
  onOrderDetected(callback: (data: { userId: string } & OrderDetectedEvent) => void): void {
    this.on(MessageEventType.ORDER_DETECTED, callback);
  }

  /**
   * Subscribe to conversation updated events
   */
  onConversationUpdated(
    callback: (data: { userId: string } & ConversationUpdatedEvent) => void
  ): void {
    this.on(MessageEventType.CONVERSATION_UPDATED, callback);
  }

  /**
   * Remove all listeners for a specific event type
   */
  removeAllListenersForEvent(eventType: MessageEventType): void {
    this.removeAllListeners(eventType);
  }

  /**
   * Send event to user via WebSocket
   */
  private sendToSocket(userId: string, event: string, data: unknown): void {
    try {
      const socketService = getSocketService();
      socketService.sendToUser(userId, event, data);
    } catch (error) {
      // Socket service may not be initialized in all contexts (e.g., tests)
      // Log but don't fail the event emission
      console.warn(`Failed to send socket event: ${error}`);
    }
  }
}

// Export singleton getter for convenience
export const getEventEmitterService = (): EventEmitterService => {
  return EventEmitterService.getInstance();
};
