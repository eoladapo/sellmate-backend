import { injectable, inject } from 'tsyringe';
import { Message, MessageAIAnalysis } from '../entities';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { IntegrationConnectionRepository } from '../../integrations/repositories';
import {
  IMessageSyncService,
  SyncResult,
  SyncStatus,
  IncomingMessage,
  SyncOptions,
  ProcessedMessage,
} from '../interfaces';
import { Platform, MessageType, MessageStatus, ConnectionStatus } from '../../integrations/enums';
import { MessageSender, EntryMode } from '../enums';
import { TOKENS } from '../../../di/tokens';
import { AIService } from '../../ai/services/ai.service';
import { IAIAnalysisOutput, IResponseSuggestion } from '../../ai/interfaces';
import { IMessageEventEmitter } from '../events/message-events';
import { NewMessageEvent, OrderDetectedEvent, ConversationUpdatedEvent } from '../events/message-events';

/**
 * Scheduled sync job tracking
 */
interface ScheduledJob {
  userId: string;
  platform: Platform;
  intervalId: NodeJS.Timeout;
}

/**
 * AI analysis confidence threshold for order detection
 * Requirements: 2.2
 */
const ORDER_DETECTION_THRESHOLD = 0.5;

/**
 * Message Sync Service
 * Handles synchronization of messages from external platforms
 */
@injectable()
export class MessageSyncService implements IMessageSyncService {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private aiService: AIService;
  private eventEmitter: IMessageEventEmitter;

  constructor(
    @inject(TOKENS.ConversationRepository) private conversationRepository: ConversationRepository,
    @inject(TOKENS.MessageRepository) private messageRepository: MessageRepository,
    @inject(TOKENS.IntegrationConnectionRepository)
    private integrationConnectionRepository: IntegrationConnectionRepository,
    @inject(TOKENS.AIService) aiService?: AIService,
    @inject(TOKENS.EventEmitterService) eventEmitter?: IMessageEventEmitter
  ) {
    // AIService is optional to maintain backward compatibility
    this.aiService = aiService || new AIService();
    // EventEmitterService is optional to maintain backward compatibility
    // Falls back to singleton if not injected
    if (eventEmitter) {
      this.eventEmitter = eventEmitter;
    } else {
      // Lazy import to avoid circular dependency issues
      const { getEventEmitterService } = require('../events/event-emitter.service');
      this.eventEmitter = getEventEmitterService();
    }
  }

  /**
   * Sync messages for a specific platform
   */
  async syncPlatform(
    userId: string,
    platform: Platform,
    options?: SyncOptions
  ): Promise<SyncResult> {
    const result: SyncResult = {
      platform,
      success: false,
      messagesProcessed: 0,
      newMessages: 0,
      duplicatesSkipped: 0,
      conversationsUpdated: 0,
      hasMore: false,
      errors: [],
    };

    try {
      // Check if platform is connected
      const connection = await this.integrationConnectionRepository.findByUserAndPlatform(
        userId,
        platform
      );

      if (!connection || connection.status !== ConnectionStatus.CONNECTED) {
        result.errors?.push(`${platform} is not connected`);
        return result;
      }

      // Check if sync is already in progress
      if (connection.syncInProgress) {
        result.errors?.push('Sync already in progress');
        return result;
      }

      // Mark sync as in progress
      await this.integrationConnectionRepository.setSyncInProgress(userId, platform, true);

      try {
        // In a real implementation, this would call the platform's API
        // For now, we just update the sync status
        result.success = true;
        result.lastSyncTimestamp = new Date();

        // Update last sync timestamp
        await this.integrationConnectionRepository.updateLastSync(
          userId,
          platform,
          options?.cursor
        );
      } finally {
        // Always mark sync as complete
        await this.integrationConnectionRepository.setSyncInProgress(userId, platform, false);
      }

      return result;
    } catch (error) {
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error');

      // Update connection with error
      await this.integrationConnectionRepository.updateStatus(
        userId,
        platform,
        ConnectionStatus.ERROR,
        error instanceof Error ? error.message : 'Sync failed'
      );

      return result;
    }
  }

  /**
   * Sync all connected platforms for a user
   */
  async syncAllPlatforms(userId: string): Promise<SyncResult[]> {
    const connections = await this.integrationConnectionRepository.findConnectedByUser(userId);
    const results: SyncResult[] = [];

    for (const connection of connections) {
      const result = await this.syncPlatform(userId, connection.platform);
      results.push(result);
    }

    return results;
  }

  /**
   * Process incoming messages from webhook
   */
  async processIncomingMessages(
    userId: string,
    platform: Platform,
    messages: IncomingMessage[]
  ): Promise<Message[]> {
    const processedMessages: Message[] = [];
    const conversationsToUpdate = new Set<string>();

    for (const incoming of messages) {
      // Check for duplicate
      const isDuplicate = await this.isDuplicateMessage(platform, incoming.platformMessageId);

      if (isDuplicate) {
        continue;
      }

      // Find or create conversation
      const conversation = await this.conversationRepository.findByUserAndPlatformId(
        userId,
        platform,
        incoming.platformConversationId
      );

      let conversationId: string;

      if (conversation) {
        conversationId = conversation.id;

        // Update participant info if needed
        if (incoming.senderName && !conversation.participantName) {
          await this.conversationRepository.update(conversation.id, {
            participantName: incoming.senderName,
            platformParticipantId: incoming.senderId,
          });
        }
        if (incoming.senderProfilePicture) {
          await this.conversationRepository.update(conversation.id, {
            participantProfilePicture: incoming.senderProfilePicture,
          });
        }
      } else {
        // Create new conversation
        const newConversation = await this.conversationRepository.create({
          userId,
          platform,
          platformConversationId: incoming.platformConversationId,
          platformParticipantId: incoming.senderId,
          participantName: incoming.senderName,
          participantProfilePicture: incoming.senderProfilePicture,
          entryMode: EntryMode.SYNCED,
          unreadCount: 0,
          hasOrderDetected: false,
        });
        conversationId = newConversation.id;
      }

      // Create message
      const message = await this.messageRepository.create({
        conversationId,
        content: incoming.content,
        sender: MessageSender.CUSTOMER,
        platform,
        platformMessageId: incoming.platformMessageId,
        messageType: (incoming.messageType as MessageType) || MessageType.TEXT,
        status: MessageStatus.DELIVERED,
        timestamp: incoming.timestamp,
        entryMode: EntryMode.SYNCED,
        isRead: false,
        metadata: incoming.metadata as object,
      });

      processedMessages.push(message);
      conversationsToUpdate.add(conversationId);
    }

    // Update conversation last messages and unread counts
    for (const conversationId of conversationsToUpdate) {
      const latestMessage = await this.messageRepository.findLatestByConversation(conversationId);

      if (latestMessage) {
        await this.conversationRepository.updateLastMessage(
          conversationId,
          latestMessage.content,
          latestMessage.sender,
          latestMessage.timestamp
        );
      }

      // Increment unread count for each new customer message
      const newCustomerMessages = processedMessages.filter(
        (m) => m.conversationId === conversationId && m.sender === MessageSender.CUSTOMER
      );

      if (newCustomerMessages.length > 0) {
        const conversation = await this.conversationRepository.findById(conversationId);
        if (conversation) {
          await this.conversationRepository.updateUnreadCount(
            conversationId,
            conversation.unreadCount + newCustomerMessages.length
          );
        }
      }
    }

    return processedMessages;
  }

  /**
   * Process incoming messages with AI analysis
   * Enhanced to include AI analysis and event emission
   * Requirements: 2.1, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2
   */
  async processIncomingMessagesWithAI(
    userId: string,
    platform: Platform,
    messages: IncomingMessage[]
  ): Promise<ProcessedMessage[]> {
    const processedMessages: ProcessedMessage[] = [];
    const conversationsToUpdate = new Set<string>();

    for (const incoming of messages) {
      // Check for duplicate
      const isDuplicate = await this.isDuplicateMessage(platform, incoming.platformMessageId);

      if (isDuplicate) {
        continue;
      }

      // Find or create conversation
      const conversation = await this.conversationRepository.findByUserAndPlatformId(
        userId,
        platform,
        incoming.platformConversationId
      );

      let conversationId: string;

      if (conversation) {
        conversationId = conversation.id;

        // Update participant info if needed
        if (incoming.senderName && !conversation.participantName) {
          await this.conversationRepository.update(conversation.id, {
            participantName: incoming.senderName,
            platformParticipantId: incoming.senderId,
          });
        }
        if (incoming.senderProfilePicture) {
          await this.conversationRepository.update(conversation.id, {
            participantProfilePicture: incoming.senderProfilePicture,
          });
        }
      } else {
        // Create new conversation
        const newConversation = await this.conversationRepository.create({
          userId,
          platform,
          platformConversationId: incoming.platformConversationId,
          platformParticipantId: incoming.senderId,
          participantName: incoming.senderName,
          participantProfilePicture: incoming.senderProfilePicture,
          entryMode: EntryMode.SYNCED,
          unreadCount: 0,
          hasOrderDetected: false,
        });
        conversationId = newConversation.id;
      }

      // Create message
      const message = await this.messageRepository.create({
        conversationId,
        content: incoming.content,
        sender: MessageSender.CUSTOMER,
        platform,
        platformMessageId: incoming.platformMessageId,
        messageType: (incoming.messageType as MessageType) || MessageType.TEXT,
        status: MessageStatus.DELIVERED,
        timestamp: incoming.timestamp,
        entryMode: EntryMode.SYNCED,
        isRead: false,
        metadata: incoming.metadata as object,
      });

      // Perform AI analysis on customer messages
      // Requirements: 2.1, 2.3, 2.4, 2.5
      let aiAnalysisResult: IAIAnalysisOutput | null = null;
      let orderDetected = false;

      try {
        // Get conversation context for better AI analysis
        const recentMessages = await this.messageRepository.findRecentByConversation(
          conversationId,
          5
        );
        const conversationContext = recentMessages
          .reverse()
          .map((m) => `${m.sender}: ${m.content}`);

        // Call AI service to analyze the message
        aiAnalysisResult = await this.aiService.analyzeMessage({
          messageContent: incoming.content,
          conversationId,
          platform: platform as 'whatsapp' | 'instagram',
          conversationContext,
        });

        // Store AI analysis results in message
        // Requirements: 2.3, 2.4, 3.1, 3.2
        const messageAIAnalysis: MessageAIAnalysis & {
          suggestedResponses?: IResponseSuggestion[];
          pendingAnalysis?: boolean;
        } = {
          orderDetected: aiAnalysisResult.orderDetected,
          confidenceScore: aiAnalysisResult.confidence,
          extractedDetails: aiAnalysisResult.extractedDetails,
          customerIntent: aiAnalysisResult.customerIntent as MessageAIAnalysis['customerIntent'],
          suggestedResponses: aiAnalysisResult.suggestedResponses,
          analyzedAt: new Date(),
          pendingAnalysis: false,
        };

        await this.messageRepository.updateAIAnalysis(message.id, messageAIAnalysis);
        message.aiAnalysis = messageAIAnalysis;

        // Check if order is detected with confidence above threshold
        // Requirements: 2.2
        if (
          aiAnalysisResult.orderDetected &&
          aiAnalysisResult.confidence > ORDER_DETECTION_THRESHOLD
        ) {
          orderDetected = true;
          await this.conversationRepository.setOrderDetected(conversationId, true);
        }
      } catch (error) {
        // Handle AI service failures gracefully
        // Requirements: 2.5
        console.error('AI analysis failed for message:', message.id, error);

        // Mark message for later analysis
        const pendingAnalysis: MessageAIAnalysis & { pendingAnalysis?: boolean } = {
          orderDetected: false,
          confidenceScore: 0,
          pendingAnalysis: true,
          analyzedAt: new Date(),
        };
        await this.messageRepository.updateAIAnalysis(message.id, pendingAnalysis);
        message.aiAnalysis = pendingAnalysis;
      }

      processedMessages.push(message as ProcessedMessage);
      conversationsToUpdate.add(conversationId);

      // Emit events after message storage
      // Requirements: 4.1, 4.2
      await this.emitMessageEvents(
        userId,
        message,
        conversationId,
        platform,
        orderDetected,
        aiAnalysisResult
      );
    }

    // Update conversation last messages and unread counts
    for (const conversationId of conversationsToUpdate) {
      const latestMessage = await this.messageRepository.findLatestByConversation(conversationId);

      if (latestMessage) {
        await this.conversationRepository.updateLastMessage(
          conversationId,
          latestMessage.content,
          latestMessage.sender,
          latestMessage.timestamp
        );
      }

      // Increment unread count for each new customer message
      const newCustomerMessages = processedMessages.filter(
        (m) => m.conversationId === conversationId && m.sender === MessageSender.CUSTOMER
      );

      if (newCustomerMessages.length > 0) {
        const conversation = await this.conversationRepository.findById(conversationId);
        if (conversation) {
          await this.conversationRepository.updateUnreadCount(
            conversationId,
            conversation.unreadCount + newCustomerMessages.length
          );

          // Emit conversation updated event
          // Requirements: 4.3
          const conversationUpdatedEvent: ConversationUpdatedEvent = {
            conversationId,
            unreadCount: conversation.unreadCount + newCustomerMessages.length,
            lastMessage: {
              content: latestMessage?.content || '',
              timestamp: latestMessage?.timestamp || new Date(),
              sender: latestMessage?.sender || MessageSender.CUSTOMER,
            },
            hasOrderDetected: conversation.hasOrderDetected,
          };
          this.eventEmitter.emitConversationUpdated(userId, conversationUpdatedEvent);
        }
      }
    }

    return processedMessages;
  }

  /**
   * Emit message events for real-time notifications
   * Requirements: 4.1, 4.2
   */
  private async emitMessageEvents(
    userId: string,
    message: Message,
    conversationId: string,
    platform: Platform,
    orderDetected: boolean,
    aiAnalysisResult: IAIAnalysisOutput | null
  ): Promise<void> {
    // Emit NewMessageEvent
    // Requirements: 4.1, 4.3
    const newMessageEvent: NewMessageEvent = {
      conversationId,
      messageId: message.id,
      messagePreview: message.content.substring(0, 100),
      platform,
      timestamp: message.timestamp,
      orderDetected,
    };
    this.eventEmitter.emitNewMessage(userId, newMessageEvent);

    // Emit OrderDetectedEvent if order was detected
    // Requirements: 4.2
    if (orderDetected && aiAnalysisResult) {
      const orderDetectedEvent: OrderDetectedEvent = {
        ...newMessageEvent,
        extractedDetails: aiAnalysisResult.extractedDetails,
        confidence: aiAnalysisResult.confidence,
        suggestedResponses: aiAnalysisResult.suggestedResponses,
      };
      this.eventEmitter.emitOrderDetected(userId, orderDetectedEvent);
    }
  }

  /**
   * Check if a message is a duplicate
   */
  async isDuplicateMessage(platform: Platform, platformMessageId: string): Promise<boolean> {
    return this.messageRepository.existsByPlatformMessageId(platform, platformMessageId);
  }

  /**
   * Get sync status for a platform
   */
  async getSyncStatus(userId: string, platform: Platform): Promise<SyncStatus | null> {
    const connection = await this.integrationConnectionRepository.findByUserAndPlatform(
      userId,
      platform
    );

    if (!connection) {
      return null;
    }

    return {
      userId,
      platform,
      inProgress: connection.syncInProgress,
      lastSyncAt: connection.lastSyncAt,
      lastSyncCursor: connection.lastSyncCursor,
      lastError: connection.lastError,
      consecutiveErrors: connection.consecutiveErrors,
    };
  }

  /**
   * Get sync status for all platforms
   */
  async getAllSyncStatuses(userId: string): Promise<SyncStatus[]> {
    const connections = await this.integrationConnectionRepository.findByUser(userId);

    return connections.map((connection) => ({
      userId,
      platform: connection.platform,
      inProgress: connection.syncInProgress,
      lastSyncAt: connection.lastSyncAt,
      lastSyncCursor: connection.lastSyncCursor,
      lastError: connection.lastError,
      consecutiveErrors: connection.consecutiveErrors,
    }));
  }

  /**
   * Schedule periodic sync for a user
   */
  scheduleSync(userId: string, platform: Platform, intervalMinutes: number): void {
    const jobKey = `${userId}:${platform}`;

    // Cancel existing job if any
    this.cancelScheduledSync(userId, platform);

    // Create new scheduled job
    const intervalId = setInterval(
      () => {
        this.syncPlatform(userId, platform).catch((error) => {
          console.error(`Scheduled sync failed for ${userId}:${platform}:`, error);
        });
      },
      intervalMinutes * 60 * 1000
    );

    this.scheduledJobs.set(jobKey, {
      userId,
      platform,
      intervalId,
    });
  }

  /**
   * Cancel scheduled sync
   */
  cancelScheduledSync(userId: string, platform: Platform): void {
    const jobKey = `${userId}:${platform}`;
    const job = this.scheduledJobs.get(jobKey);

    if (job) {
      clearInterval(job.intervalId);
      this.scheduledJobs.delete(jobKey);
    }
  }

  /**
   * Handle sync conflict (same message from multiple sources)
   */
  async resolveConflict(
    existingMessage: Message,
    incomingMessage: IncomingMessage
  ): Promise<Message> {
    // Strategy: Keep existing message, update metadata if needed
    // In most cases, the existing message should be authoritative

    // If incoming has more recent timestamp, update the existing
    if (incomingMessage.timestamp > existingMessage.timestamp) {
      return this.messageRepository.update(existingMessage.id, {
        timestamp: incomingMessage.timestamp,
        metadata: {
          ...existingMessage.metadata,
          ...incomingMessage.metadata,
        } as object,
      });
    }

    return existingMessage;
  }

  /**
   * Get last sync timestamp for a platform
   */
  async getLastSyncTimestamp(userId: string, platform: Platform): Promise<Date | null> {
    const connection = await this.integrationConnectionRepository.findByUserAndPlatform(
      userId,
      platform
    );

    return connection?.lastSyncAt || null;
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSyncTimestamp(
    userId: string,
    platform: Platform,
    _timestamp: Date,
    cursor?: string
  ): Promise<void> {
    await this.integrationConnectionRepository.updateLastSync(userId, platform, cursor);
  }
}
