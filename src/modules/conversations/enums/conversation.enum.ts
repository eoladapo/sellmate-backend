/**
 * Message sender type
 */
export enum MessageSender {
  CUSTOMER = 'customer',
  SELLER = 'seller',
}

/**
 * Conversation status
 */
export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

/**
 * Entry mode for conversations (manual vs synced)
 */
export enum EntryMode {
  SYNCED = 'synced',
  MANUAL = 'manual',
}
