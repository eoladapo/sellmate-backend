/**
 * Supported social media platforms for integration
 */
export enum Platform {
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram',
}

/**
 * Connection status for platform integrations
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ERROR = 'error',
  TOKEN_EXPIRED = 'token_expired',
}

/**
 * Message types supported by the platform
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
}

/**
 * Message direction
 */
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

/**
 * Message delivery status
 */
export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Webhook event types
 */
export enum WebhookEventType {
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_READ = 'message_read',
  MESSAGE_FAILED = 'message_failed',
  STATUS_UPDATE = 'status_update',
}
