import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { BaseIntegrationService } from './base-integration.service';
import {
  Platform,
  MessageType,
  MessageDirection,
  MessageStatus,
} from '../enums';
import {
  SendMessageRequest,
  SendMessageResponse,
  IntegrationMessage,
  WebhookPayload,
  WebhookVerificationResult,
  SyncOptions,
  SyncResult,
  SyncedConversation,
} from '../interfaces';
import { appConfig } from '../../../config/app.config';

const INSTAGRAM_API_VERSION = 'v18.0';
const INSTAGRAM_API_BASE_URL = 'https://graph.facebook.com';

/**
 * Instagram Messaging API Integration Service
 * Lean MVP implementation for sending/receiving DMs
 */
export class InstagramIntegrationService extends BaseIntegrationService {
  readonly platform = Platform.INSTAGRAM;

  private client: AxiosInstance | null = null;
  private instagramAccountId: string | null = null;

  protected async performInitialization(): Promise<void> {
    const accessToken = this.getAccessToken();
    this.instagramAccountId = this.getBusinessAccountId();

    this.client = axios.create({
      baseURL: `${INSTAGRAM_API_BASE_URL}/${INSTAGRAM_API_VERSION}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  protected async checkApiReachability(): Promise<boolean> {
    try {
      if (!this.client || !this.instagramAccountId) return false;
      await this.client.get(`/${this.instagramAccountId}`, { params: { fields: 'id,username' } });
      return true;
    } catch {
      return false;
    }
  }

  protected async checkTokenValidity(): Promise<boolean> {
    return this.checkApiReachability();
  }

  protected async checkWebhookConfiguration(): Promise<boolean> {
    return true; // Configured at Meta App level
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!this.client || !this.instagramAccountId) {
      return { success: false, error: 'Instagram not initialized' };
    }

    return this.executeWithRetry(async () => {
      const payload: Record<string, unknown> = {
        recipient: { id: request.recipientId },
      };

      // Build message based on type
      if (request.type === MessageType.IMAGE && request.metadata?.mediaUrl) {
        payload.message = {
          attachment: { type: 'image', payload: { url: request.metadata.mediaUrl, is_reusable: true } },
        };
      } else if (request.type === MessageType.VIDEO && request.metadata?.mediaUrl) {
        payload.message = {
          attachment: { type: 'video', payload: { url: request.metadata.mediaUrl, is_reusable: true } },
        };
      } else {
        payload.message = { text: request.content };
      }

      const response = await this.client!.post(`/${this.instagramAccountId}/messages`, payload);

      return {
        success: true,
        messageId: response.data.message_id,
        platformMessageId: response.data.message_id,
        timestamp: new Date(),
      };
    }, 'sendMessage');
  }

  async syncMessages(options?: SyncOptions): Promise<SyncResult> {
    if (!this.client || !this.instagramAccountId) {
      return {
        platform: this.platform,
        success: false,
        messagesCount: 0,
        conversationsCount: 0,
        messages: [],
        newConversations: [],
        lastSyncTimestamp: new Date(),
        hasMore: false,
        errors: [{ code: 'NOT_INITIALIZED', message: 'Integration not initialized', retryable: false }],
      };
    }

    try {
      const messages: IntegrationMessage[] = [];
      const conversations: SyncedConversation[] = [];

      const response = await this.client.get(`/${this.instagramAccountId}/conversations`, {
        params: {
          platform: 'instagram',
          fields: 'id,participants,updated_time,messages{id,message,from,created_time}',
          limit: options?.limit || 25,
        },
      });

      for (const conv of response.data.data || []) {
        const participant = conv.participants?.data?.[0];

        conversations.push({
          platformConversationId: conv.id,
          participantId: participant?.id || '',
          participantName: participant?.name,
          lastMessageAt: new Date(conv.updated_time),
          messageCount: conv.messages?.data?.length || 0,
          unreadCount: 0,
        });

        for (const msg of conv.messages?.data || []) {
          const msgDate = new Date(msg.created_time);
          if (options?.since && msgDate < options.since) continue;

          messages.push({
            id: crypto.randomUUID(),
            platformMessageId: msg.id,
            platform: Platform.INSTAGRAM,
            conversationId: conv.id,
            senderId: msg.from?.id || '',
            senderName: msg.from?.name,
            recipientId: this.instagramAccountId!,
            content: msg.message || '',
            type: MessageType.TEXT,
            direction: msg.from?.id === this.instagramAccountId ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
            status: MessageStatus.DELIVERED,
            timestamp: msgDate,
          });
        }
      }

      this.updateLastSync();

      return {
        platform: this.platform,
        success: true,
        messagesCount: messages.length,
        conversationsCount: conversations.length,
        messages,
        newConversations: conversations,
        lastSyncTimestamp: new Date(),
        hasMore: !!response.data.paging?.next,
        nextCursor: response.data.paging?.cursors?.after,
      };
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Sync failed');
      return {
        platform: this.platform,
        success: false,
        messagesCount: 0,
        conversationsCount: 0,
        messages: [],
        newConversations: [],
        lastSyncTimestamp: new Date(),
        hasMore: false,
        errors: [{ code: 'SYNC_ERROR', message: error instanceof Error ? error.message : 'Unknown error', retryable: true }],
      };
    }
  }

  verifyWebhook(payload: WebhookPayload): WebhookVerificationResult {
    const body = payload.body as Record<string, unknown>;

    // Handle verification challenge (GET request)
    if (body?.['hub.mode'] === 'subscribe') {
      if (body['hub.verify_token'] === appConfig.social.instagram.webhookVerifyToken) {
        return { isValid: true, challenge: String(body['hub.challenge']) };
      }
      return { isValid: false, error: 'Invalid verify token' };
    }

    // Verify signature for POST requests
    const signature = payload.headers['x-hub-signature-256'];
    if (!signature) {
      return { isValid: false, error: 'Missing signature' };
    }

    const appSecret = appConfig.social.instagram.appSecret;
    if (!appSecret) {
      return { isValid: false, error: 'App secret not configured' };
    }

    const bodyString = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(bodyString).digest('hex');

    return signature === expected ? { isValid: true } : { isValid: false, error: 'Invalid signature' };
  }

  async processWebhook(payload: WebhookPayload): Promise<IntegrationMessage[]> {
    const messages: IntegrationMessage[] = [];
    const body = payload.body as InstagramWebhookPayload;

    if (!body.entry) return messages;

    for (const entry of body.entry) {
      for (const event of entry.messaging || []) {
        if (!event.message) continue;

        messages.push({
          id: crypto.randomUUID(),
          platformMessageId: event.message.mid,
          platform: Platform.INSTAGRAM,
          senderId: event.sender.id,
          recipientId: event.recipient.id,
          content: event.message.text || this.extractAttachmentContent(event.message),
          type: this.mapMessageType(event.message),
          direction: MessageDirection.INBOUND,
          status: MessageStatus.DELIVERED,
          timestamp: new Date(event.timestamp),
          metadata: {
            replyToMessageId: event.message.reply_to?.mid,
          },
        });
      }
    }

    return messages;
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    // Meta tokens are long-lived (60 days), refresh handled by OAuth service
    return false;
  }

  private mapMessageType(message: InstagramMessage): MessageType {
    if (message.text) return MessageType.TEXT;
    if (message.attachments?.length) {
      const type = message.attachments[0].type;
      if (type === 'image') return MessageType.IMAGE;
      if (type === 'video') return MessageType.VIDEO;
      if (type === 'audio') return MessageType.AUDIO;
    }
    return MessageType.TEXT;
  }

  private extractAttachmentContent(message: InstagramMessage): string {
    if (!message.attachments?.length) return '';
    const type = message.attachments[0].type;
    return `[${type.charAt(0).toUpperCase() + type.slice(1)}]`;
  }
}

// Webhook Types
interface InstagramWebhookPayload {
  entry: Array<{
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: InstagramMessage;
    }>;
  }>;
}

interface InstagramMessage {
  mid: string;
  text?: string;
  attachments?: Array<{ type: string; payload: { url?: string } }>;
  reply_to?: { mid: string };
}
