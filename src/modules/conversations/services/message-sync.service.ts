import { injectable, inject } from 'tsyringe';
import { Message } from '../entities';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { IntegrationConnectionRepository } from '../../integrations/repositories';
import {
  IMessageSyncService,
  SyncResult,
  SyncStatus,
  IncomingMessage,
  SyncOptions,
} from '../interfaces';
import { Platform, MessageType, MessageStatus, ConnectionStatus } from '../../integrations/enums';
import { MessageSender, EntryMode } from '../enums';
import { TOKENS } from '../../../di/tokens';

/**
 * Scheduled sync job tracking
 */
interface ScheduledJob {
  userId: string;
  platform: Platform;
  intervalId: NodeJS.Timeout;
}

/**
 * Message Sync Service
 * Handles synchronization of messages from external platforms
 */
@injectable()
export class MessageSyncService implements IMessageSyncService {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();

  constructor(
    @inject(TOKENS.ConversationRepository) private conversationRepository: ConversationRepository,
    @inject(TOKENS.MessageRepository) private messageRepository: MessageRepository,
    @inject(TOKENS.IntegrationConnectionRepository)
    private integrationConnectionRepository: IntegrationConnectionRepository
  ) {}

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
