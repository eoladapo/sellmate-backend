import { Message, MessageAIAnalysis } from '../entities';
import { Platform, MessageStatus } from '../../integrations/enums';
import { MessageSender } from '../enums';
import { PaginationOptions, PaginatedResult } from './conversation-repository.interface';

/**
 * Message filter options
 */
export interface MessageFilters {
  sender?: MessageSender;
  platform?: Platform;
  status?: MessageStatus;
  hasAIAnalysis?: boolean;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Message Repository Interface
 */
export interface IMessageRepository {
  findById(id: string): Promise<Message | null>;
  findByPlatformMessageId(
    platform: Platform,
    platformMessageId: string
  ): Promise<Message | null>;
  findByConversation(
    conversationId: string,
    filters?: MessageFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Message>>;
  findRecentByConversation(
    conversationId: string,
    limit?: number
  ): Promise<Message[]>;
  create(data: Partial<Message>): Promise<Message>;
  createMany(data: Partial<Message>[]): Promise<Message[]>;
  update(id: string, data: Partial<Message>): Promise<Message>;
  updateStatus(id: string, status: MessageStatus): Promise<void>;
  updateAIAnalysis(id: string, analysis: MessageAIAnalysis): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markAllAsReadInConversation(conversationId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
  countByConversation(conversationId: string): Promise<number>;
  countUnreadByConversation(conversationId: string): Promise<number>;
  existsByPlatformMessageId(
    platform: Platform,
    platformMessageId: string
  ): Promise<boolean>;
  findLatestByConversation(conversationId: string): Promise<Message | null>;
  findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Message[]>;
}
