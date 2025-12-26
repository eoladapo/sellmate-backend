import { Platform } from '../../integrations/enums';
import { Message, MessageAIAnalysis } from '../entities';
import { IResponseSuggestion } from '../../ai/interfaces';

/**
 * Sync result for a single platform
 */
export interface SyncResult {
  platform: Platform;
  success: boolean;
  messagesProcessed: number;
  newMessages: number;
  duplicatesSkipped: number;
  conversationsUpdated: number;
  lastSyncTimestamp?: Date;
  cursor?: string;
  hasMore: boolean;
  errors?: string[];
}

/**
 * Sync status for tracking
 */
export interface SyncStatus {
  userId: string;
  platform: Platform;
  inProgress: boolean;
  lastSyncAt?: Date;
  lastSyncCursor?: string;
  lastError?: string;
  consecutiveErrors: number;
}

/**
 * Incoming message from platform
 */
export interface IncomingMessage {
  platformMessageId: string;
  platformConversationId: string;
  senderId: string;
  senderName?: string;
  senderProfilePicture?: string;
  content: string;
  timestamp: Date;
  messageType?: string;
  metadata?: object;
}

/**
 * Sync options
 */
export interface SyncOptions {
  fromTimestamp?: Date;
  cursor?: string;
  limit?: number;
  forceFullSync?: boolean;
}

/**
 * Processed message with AI analysis results
 * Requirements: 2.1, 2.3, 2.4, 3.1, 3.2
 */
export interface ProcessedMessage extends Message {
  aiAnalysis?: MessageAIAnalysis & {
    suggestedResponses?: IResponseSuggestion[];
    pendingAnalysis?: boolean;
  };
}

/**
 * Message Sync Service Interface
 */
export interface IMessageSyncService {
  /**
   * Sync messages for a specific platform
   */
  syncPlatform(userId: string, platform: Platform, options?: SyncOptions): Promise<SyncResult>;

  /**
   * Sync all connected platforms for a user
   */
  syncAllPlatforms(userId: string): Promise<SyncResult[]>;

  /**
   * Process incoming messages from webhook
   */
  processIncomingMessages(
    userId: string,
    platform: Platform,
    messages: IncomingMessage[]
  ): Promise<Message[]>;

  /**
   * Process incoming messages with AI analysis
   * Enhanced to include AI analysis and event emission
   * Requirements: 2.1, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2
   */
  processIncomingMessagesWithAI(
    userId: string,
    platform: Platform,
    messages: IncomingMessage[]
  ): Promise<ProcessedMessage[]>;

  /**
   * Check if a message is a duplicate
   */
  isDuplicateMessage(platform: Platform, platformMessageId: string): Promise<boolean>;

  /**
   * Get sync status for a platform
   */
  getSyncStatus(userId: string, platform: Platform): Promise<SyncStatus | null>;

  /**
   * Get sync status for all platforms
   */
  getAllSyncStatuses(userId: string): Promise<SyncStatus[]>;

  /**
   * Schedule periodic sync for a user
   */
  scheduleSync(userId: string, platform: Platform, intervalMinutes: number): void;

  /**
   * Cancel scheduled sync
   */
  cancelScheduledSync(userId: string, platform: Platform): void;

  /**
   * Handle sync conflict (same message from multiple sources)
   */
  resolveConflict(existingMessage: Message, incomingMessage: IncomingMessage): Promise<Message>;

  /**
   * Get last sync timestamp for a platform
   */
  getLastSyncTimestamp(userId: string, platform: Platform): Promise<Date | null>;

  /**
   * Update last sync timestamp
   */
  updateLastSyncTimestamp(
    userId: string,
    platform: Platform,
    timestamp: Date,
    cursor?: string
  ): Promise<void>;
}
