import { Conversation, Message } from '../entities';
import { Platform } from '../../integrations/enums';
import {
  ConversationFilters,
  PaginationOptions,
  PaginatedResult,
} from './conversation-repository.interface';
import { MessageSender, EntryMode } from '../enums';

export interface CreateConversationRequest {
  userId: string;
  platform: Platform;
  platformConversationId?: string;
  platformParticipantId?: string;
  participantName?: string;
  participantProfilePicture?: string;
  customerId?: string;
  entryMode?: EntryMode;
  notes?: string;
}

export interface CreateManualConversationRequest {
  userId: string;
  customerName: string;
  customerContact?: string;
  platform: Platform;
  notes?: string;
}

export interface AddMessageRequest {
  conversationId: string;
  content: string;
  sender: MessageSender;
  platform: Platform;
  platformMessageId?: string;
  timestamp?: Date;
  entryMode?: EntryMode;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  platform: Platform;
  participantName?: string;
  participantProfilePicture?: string;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender: MessageSender;
  };
  unreadCount: number;
  hasOrderDetected: boolean;
  customerId?: string;
  updatedAt: Date;
}

export interface IConversationService {
  getConversations(
    userId: string,
    filters?: ConversationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ConversationSummary>>;

  getConversationById(conversationId: string, userId: string): Promise<Conversation>;

  getConversationWithMessages(
    conversationId: string,
    userId: string,
    messageLimit?: number
  ): Promise<ConversationWithMessages>;

  createConversation(request: CreateConversationRequest): Promise<Conversation>;

  createManualConversation(request: CreateManualConversationRequest): Promise<Conversation>;

  findOrCreateConversation(
    userId: string,
    platform: Platform,
    platformConversationId: string,
    participantInfo?: {
      platformParticipantId?: string;
      participantName?: string;
      participantProfilePicture?: string;
    }
  ): Promise<Conversation>;

  updateConversation(
    conversationId: string,
    userId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation>;

  archiveConversation(conversationId: string, userId: string): Promise<void>;

  deleteConversation(conversationId: string, userId: string): Promise<void>;

  addMessage(request: AddMessageRequest): Promise<Message>;

  getMessages(
    conversationId: string,
    userId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Message>>;

  markConversationAsRead(conversationId: string, userId: string): Promise<void>;

  searchConversations(
    userId: string,
    searchTerm: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ConversationSummary>>;

  getUnreadCount(userId: string): Promise<number>;

  getConversationCount(userId: string, filters?: ConversationFilters): Promise<number>;

  linkCustomerToConversation(
    conversationId: string,
    userId: string,
    customerId: string
  ): Promise<Conversation>;
}
