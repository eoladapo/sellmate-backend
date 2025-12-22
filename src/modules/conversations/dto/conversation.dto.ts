import { Platform } from '../../integrations/enums';
import { MessageSender, ConversationStatus } from '../enums';

/**
 * List conversations query parameters
 */
export interface ListConversationsQueryDto {
  platform?: Platform;
  unreadOnly?: boolean;
  hasOrderDetected?: boolean;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Create manual conversation request
 */
export interface CreateManualConversationDto {
  customerName: string;
  customerContact?: string;
  platform: Platform;
  notes?: string;
}

/**
 * Update conversation request
 */
export interface UpdateConversationDto {
  participantName?: string;
  notes?: string;
  customerId?: string;
  status?: ConversationStatus;
}

/**
 * Send message request
 */
export interface SendMessageDto {
  content: string;
  type?: string;
}

/**
 * Add manual message request (Lite Mode)
 */
export interface AddManualMessageDto {
  content: string;
  sender: MessageSender;
  timestamp?: string;
}

/**
 * Trigger sync request
 */
export interface TriggerSyncDto {
  platform: Platform;
}

/**
 * Conversation response
 */
export interface ConversationResponseDto {
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
  status: ConversationStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message response
 */
export interface MessageResponseDto {
  id: string;
  content: string;
  sender: MessageSender;
  platform: Platform;
  timestamp: Date;
  messageType: string;
  status: string;
  isRead: boolean;
  aiAnalysis?: {
    orderDetected: boolean;
    confidenceScore: number;
  };
}

/**
 * Conversation with messages response
 */
export interface ConversationWithMessagesResponseDto extends ConversationResponseDto {
  messages: MessageResponseDto[];
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
