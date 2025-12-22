import { Platform } from '../enums';
import { IntegrationMessage } from './integration-message.interface';

/**
 * Sync options for message synchronization
 */
export interface SyncOptions {
  /** Sync messages after this timestamp */
  since?: Date;
  /** Maximum number of messages to sync */
  limit?: number;
  /** Specific conversation ID to sync */
  conversationId?: string;
  /** Include archived conversations */
  includeArchived?: boolean;
  /** Force full sync (ignore last sync timestamp) */
  forceFullSync?: boolean;
}

/**
 * Sync result
 */
export interface SyncResult {
  platform: Platform;
  success: boolean;
  messagesCount: number;
  conversationsCount: number;
  messages: IntegrationMessage[];
  newConversations: SyncedConversation[];
  lastSyncTimestamp: Date;
  hasMore: boolean;
  nextCursor?: string;
  errors?: SyncError[];
}

/**
 * Synced conversation info
 */
export interface SyncedConversation {
  platformConversationId: string;
  participantId: string;
  participantName?: string;
  participantProfilePicture?: string;
  lastMessageAt: Date;
  messageCount: number;
  unreadCount: number;
}

/**
 * Sync error
 */
export interface SyncError {
  code: string;
  message: string;
  conversationId?: string;
  messageId?: string;
  retryable: boolean;
}

/**
 * Sync state for tracking progress
 */
export interface SyncState {
  platform: Platform;
  userId: string;
  lastSyncAt?: Date;
  lastSyncCursor?: string;
  lastSyncMessageId?: string;
  syncInProgress: boolean;
  lastError?: string;
  lastErrorAt?: Date;
  consecutiveErrors: number;
}

/**
 * Sync schedule configuration
 */
export interface SyncScheduleConfig {
  platform: Platform;
  intervalMinutes: number;
  enabled: boolean;
  retryOnError: boolean;
  maxRetries: number;
  backoffMultiplier: number;
}
