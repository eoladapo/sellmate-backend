import { Conversation, Message } from '../entities';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import {
  IConversationService,
  CreateConversationRequest,
  CreateManualConversationRequest,
  AddMessageRequest,
  ConversationWithMessages,
  ConversationSummary,
  ConversationFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { Platform, MessageType, MessageStatus } from '../../integrations/enums';
import { ConversationStatus, MessageSender, EntryMode } from '../enums';
import { AppError } from '../../../api/middleware/error.middleware';

/**
 * Conversation Service
 * Handles business logic for conversation and message management
 */
export class ConversationService implements IConversationService {
  constructor(
    private conversationRepository: ConversationRepository,
    private messageRepository: MessageRepository
  ) { }

  /**
   * Get paginated list of conversations for a user
   */
  async getConversations(
    userId: string,
    filters?: ConversationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ConversationSummary>> {
    const result = await this.conversationRepository.findByUser(userId, filters, pagination);
    return {
      data: result.data.map(this.toConversationSummary),
      pagination: result.pagination,
    };
  }

  /**
   * Get a single conversation by ID
   * @throws AppError if conversation not found or user doesn't own it
   */
  async getConversationById(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }
    return conversation;
  }

  /**
   * Get conversation with messages for display
   * @throws AppError if conversation not found or user doesn't own it
   */
  async getConversationWithMessages(
    conversationId: string,
    userId: string,
    messageLimit: number = 50
  ): Promise<ConversationWithMessages> {
    const conversation = await this.conversationRepository.findByIdWithMessages(
      conversationId,
      messageLimit
    );

    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Reverse messages for chronological order (oldest first)
    if (conversation.messages) {
      conversation.messages = conversation.messages.reverse();
    }

    return conversation as ConversationWithMessages;
  }

  /**
   * Create a new conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    return this.conversationRepository.create({
      userId: request.userId,
      platform: request.platform,
      platformConversationId: request.platformConversationId,
      platformParticipantId: request.platformParticipantId,
      participantName: request.participantName,
      participantProfilePicture: request.participantProfilePicture,
      customerId: request.customerId,
      entryMode: request.entryMode || EntryMode.SYNCED,
      notes: request.notes,
      status: ConversationStatus.ACTIVE,
      unreadCount: 0,
      hasOrderDetected: false,
    });
  }

  /**
   * Create a manual conversation (Lite Mode)
   * Used when platform is not connected and user enters conversations manually
   */
  async createManualConversation(request: CreateManualConversationRequest): Promise<Conversation> {
    return this.createConversation({
      userId: request.userId,
      platform: request.platform,
      participantName: request.customerName,
      entryMode: EntryMode.MANUAL,
      notes: request.notes,
    });
  }

  /**
   * Find existing conversation by platform ID or create new one
   * Used during message sync to avoid duplicate conversations
   */
  async findOrCreateConversation(
    userId: string,
    platform: Platform,
    platformConversationId: string,
    participantInfo?: {
      platformParticipantId?: string;
      participantName?: string;
      participantProfilePicture?: string;
    }
  ): Promise<Conversation> {
    let conversation = await this.conversationRepository.findByUserAndPlatformId(
      userId,
      platform,
      platformConversationId
    );

    if (conversation) {
      // Update participant info if provided and missing
      if (participantInfo) {
        const updates: Partial<Conversation> = {};
        if (participantInfo.participantName && !conversation.participantName) {
          updates.participantName = participantInfo.participantName;
        }
        if (participantInfo.participantProfilePicture) {
          updates.participantProfilePicture = participantInfo.participantProfilePicture;
        }
        if (participantInfo.platformParticipantId && !conversation.platformParticipantId) {
          updates.platformParticipantId = participantInfo.platformParticipantId;
        }

        if (Object.keys(updates).length > 0) {
          conversation = await this.conversationRepository.update(conversation.id, updates);
        }
      }
      return conversation;
    }

    return this.createConversation({
      userId,
      platform,
      platformConversationId,
      ...participantInfo,
    });
  }

  /**
   * Update conversation details
   * @throws AppError if conversation not found or user doesn't own it
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Only allow safe field updates
    return this.conversationRepository.update(conversationId, {
      participantName: updates.participantName,
      notes: updates.notes,
      customerId: updates.customerId,
      status: updates.status,
    });
  }

  /**
   * Archive a conversation (soft delete)
   * @throws AppError if conversation not found or user doesn't own it
   */
  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }
    await this.conversationRepository.archive(conversationId);
  }

  /**
   * Delete a conversation permanently
   * @throws AppError if conversation not found or user doesn't own it
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }
    await this.conversationRepository.delete(conversationId);
  }

  /**
   * Add a message to a conversation
   * Handles duplicate detection by platform message ID
   * @throws AppError if conversation not found
   */
  async addMessage(request: AddMessageRequest): Promise<Message> {
    const conversation = await this.conversationRepository.findById(request.conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Return existing message if duplicate (by platform message ID)
    if (request.platformMessageId) {
      const existing = await this.messageRepository.findByPlatformMessageId(
        request.platform,
        request.platformMessageId
      );
      if (existing) return existing;
    }

    const timestamp = request.timestamp || new Date();

    const message = await this.messageRepository.create({
      conversationId: request.conversationId,
      content: request.content,
      sender: request.sender,
      platform: request.platform,
      platformMessageId: request.platformMessageId,
      messageType: MessageType.TEXT,
      status: MessageStatus.DELIVERED,
      timestamp,
      entryMode: request.entryMode || EntryMode.SYNCED,
      isRead: request.sender === MessageSender.SELLER,
    });

    // Update conversation's last message preview
    await this.conversationRepository.updateLastMessage(
      request.conversationId,
      request.content,
      request.sender,
      timestamp
    );

    // Increment unread count for customer messages
    if (request.sender === MessageSender.CUSTOMER) {
      await this.conversationRepository.incrementUnreadCount(request.conversationId);
    }

    return message;
  }

  /**
   * Get paginated messages for a conversation
   * @throws AppError if conversation not found or user doesn't own it
   */
  async getMessages(
    conversationId: string,
    userId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Message>> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }
    return this.messageRepository.findByConversation(conversationId, {}, pagination);
  }

  /**
   * Mark all messages in conversation as read and reset unread count
   * @throws AppError if conversation not found or user doesn't own it
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }
    await this.messageRepository.markAllAsReadInConversation(conversationId);
    await this.conversationRepository.markAsRead(conversationId);
  }

  /**
   * Search conversations by participant name or message content
   */
  async searchConversations(
    userId: string,
    searchTerm: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ConversationSummary>> {
    const result = await this.conversationRepository.findByUser(
      userId,
      { search: searchTerm },
      pagination
    );
    return {
      data: result.data.map(this.toConversationSummary),
      pagination: result.pagination,
    };
  }

  /**
   * Get total unread message count across all conversations
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.conversationRepository.countUnreadByUser(userId);
  }

  /**
   * Get conversation count with optional filters
   */
  async getConversationCount(userId: string, filters?: ConversationFilters): Promise<number> {
    return this.conversationRepository.countByUser(userId, filters);
  }

  /**
   * Link a conversation to a Customer record
   * Enables viewing customer history and insights in conversation view
   * @throws AppError if conversation not found or user doesn't own it
   */
  async linkCustomerToConversation(
    conversationId: string,
    userId: string,
    customerId: string
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }
    return this.conversationRepository.update(conversationId, { customerId });
  }

  /**
   * Convert Conversation entity to ConversationSummary for list view
   */
  private toConversationSummary(conversation: Conversation): ConversationSummary {
    return {
      id: conversation.id,
      platform: conversation.platform,
      participantName: conversation.participantName,
      participantProfilePicture: conversation.participantProfilePicture,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.unreadCount,
      hasOrderDetected: conversation.hasOrderDetected,
      customerId: conversation.customerId,
      updatedAt: conversation.updatedAt,
    };
  }
}
