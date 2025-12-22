import { Conversation } from '../entities';
import { Platform } from '../../integrations/enums';
import { ConversationStatus, EntryMode } from '../enums';

/**
 * Conversation filter options
 */
export interface ConversationFilters {
  platform?: Platform;
  status?: ConversationStatus;
  unreadOnly?: boolean;
  hasOrderDetected?: boolean;
  customerId?: string;
  entryMode?: EntryMode;
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Conversation Repository Interface
 */
export interface IConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByIdWithMessages(id: string, messageLimit?: number): Promise<Conversation | null>;
  findByUserAndPlatformId(
    userId: string,
    platform: Platform,
    platformConversationId: string
  ): Promise<Conversation | null>;
  findByUser(
    userId: string,
    filters?: ConversationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Conversation>>;
  findByCustomer(userId: string, customerId: string): Promise<Conversation[]>;
  create(data: Partial<Conversation>): Promise<Conversation>;
  update(id: string, data: Partial<Conversation>): Promise<Conversation>;
  updateUnreadCount(id: string, count: number): Promise<void>;
  incrementUnreadCount(id: string): Promise<void>;
  markAsRead(id: string): Promise<void>;
  updateLastMessage(
    id: string,
    content: string,
    sender: 'customer' | 'seller',
    timestamp: Date
  ): Promise<void>;
  setOrderDetected(id: string, detected: boolean): Promise<void>;
  archive(id: string): Promise<void>;
  delete(id: string): Promise<boolean>;
  countByUser(userId: string, filters?: ConversationFilters): Promise<number>;
  countUnreadByUser(userId: string): Promise<number>;
}
