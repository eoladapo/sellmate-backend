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
} from '../interfaces';
import { appConfig } from '../../../config/app.config';

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE_URL = 'https://graph.facebook.com';

/**
 * WhatsApp Cloud API Integration Service
 * Lean MVP implementation for sending/receiving messages
 */
export class WhatsAppIntegrationService extends BaseIntegrationService {
  readonly platform = Platform.WHATSAPP;

  private client: AxiosInstance | null = null;
  private phoneNumberId: string | null = null;

  protected async performInitialization(): Promise<void> {
    const accessToken = this.getAccessToken();
    const businessAccountId = this.getBusinessAccountId();

    this.client = axios.create({
      baseURL: `${WHATSAPP_API_BASE_URL}/${WHATSAPP_API_VERSION}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Get phone number ID
    const response = await this.client.get(`/${businessAccountId}/phone_numbers`);
    const phoneNumbers = response.data.data;
    if (!phoneNumbers?.length) {
      throw new Error('No phone numbers found for WhatsApp Business Account');
    }
    this.phoneNumberId = phoneNumbers[0].id;
  }

  protected async checkApiReachability(): Promise<boolean> {
    try {
      if (!this.client || !this.phoneNumberId) return false;
      await this.client.get(`/${this.phoneNumberId}`);
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
    if (!this.client || !this.phoneNumberId) {
      return { success: false, error: 'WhatsApp not initialized' };
    }

    return this.executeWithRetry(async () => {
      const payload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: request.recipientId,
      };

      // Build message based on type
      if (request.type === MessageType.IMAGE && request.metadata?.mediaUrl) {
        payload.type = 'image';
        payload.image = { link: request.metadata.mediaUrl, caption: request.metadata.mediaCaption };
      } else if (request.type === MessageType.DOCUMENT && request.metadata?.mediaUrl) {
        payload.type = 'document';
        payload.document = { link: request.metadata.mediaUrl, filename: request.metadata.mediaCaption || 'document' };
      } else {
        payload.type = 'text';
        payload.text = { preview_url: true, body: request.content };
      }

      // Add reply context if provided
      if (request.replyToMessageId) {
        payload.context = { message_id: request.replyToMessageId };
      }

      const response = await this.client!.post(`/${this.phoneNumberId}/messages`, payload);
      const messageId = response.data.messages?.[0]?.id;

      return {
        success: true,
        messageId,
        platformMessageId: messageId,
        timestamp: new Date(),
      };
    }, 'sendMessage');
  }

  async syncMessages(_options?: SyncOptions): Promise<SyncResult> {
    // WhatsApp Cloud API doesn't support pulling historical messages
    // All messages come through webhooks
    this.updateLastSync();
    return {
      platform: this.platform,
      success: true,
      messagesCount: 0,
      conversationsCount: 0,
      messages: [],
      newConversations: [],
      lastSyncTimestamp: new Date(),
      hasMore: false,
    };
  }

  verifyWebhook(payload: WebhookPayload): WebhookVerificationResult {
    const body = payload.body as Record<string, unknown>;

    // Handle verification challenge (GET request)
    if (body?.['hub.mode'] === 'subscribe') {
      if (body['hub.verify_token'] === appConfig.social.whatsapp.webhookVerifyToken) {
        return { isValid: true, challenge: String(body['hub.challenge']) };
      }
      return { isValid: false, error: 'Invalid verify token' };
    }

    // Verify signature for POST requests
    const signature = payload.headers['x-hub-signature-256'];
    if (!signature) {
      return { isValid: false, error: 'Missing signature' };
    }

    const appSecret = appConfig.social.whatsapp.appSecret;
    if (!appSecret) {
      return { isValid: false, error: 'App secret not configured' };
    }

    const bodyString = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(bodyString).digest('hex');

    return signature === expected ? { isValid: true } : { isValid: false, error: 'Invalid signature' };
  }

  async processWebhook(payload: WebhookPayload): Promise<IntegrationMessage[]> {
    const messages: IntegrationMessage[] = [];
    const body = payload.body as WhatsAppWebhookPayload;

    if (!body.entry) return messages;

    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        for (const msg of value.messages || []) {
          const contact = value.contacts?.find(c => c.wa_id === msg.from);

          messages.push({
            id: crypto.randomUUID(),
            platformMessageId: msg.id,
            platform: Platform.WHATSAPP,
            senderId: msg.from,
            senderName: contact?.profile?.name,
            recipientId: value.metadata.phone_number_id,
            content: this.extractContent(msg),
            type: this.mapMessageType(msg.type),
            direction: MessageDirection.INBOUND,
            status: MessageStatus.DELIVERED,
            timestamp: new Date(parseInt(msg.timestamp, 10) * 1000),
            metadata: {
              whatsappMessageType: msg.type,
              replyToMessageId: msg.context?.id,
            },
          });
        }
      }
    }

    return messages;
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    // Meta tokens are long-lived (60 days), refresh handled by OAuth service
    return false;
  }

  private mapMessageType(type: string): MessageType {
    const map: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      audio: MessageType.AUDIO,
      document: MessageType.DOCUMENT,
      location: MessageType.LOCATION,
      contacts: MessageType.CONTACT,
      sticker: MessageType.STICKER,
    };
    return map[type] || MessageType.TEXT;
  }

  private extractContent(msg: WhatsAppMessage): string {
    switch (msg.type) {
      case 'text': return msg.text?.body || '';
      case 'image': return msg.image?.caption || '[Image]';
      case 'video': return msg.video?.caption || '[Video]';
      case 'audio': return '[Audio]';
      case 'document': return msg.document?.caption || msg.document?.filename || '[Document]';
      case 'location': return `[Location: ${msg.location?.name || 'Unknown'}]`;
      case 'contacts': return `[Contact: ${msg.contacts?.[0]?.name?.formatted_name || 'Unknown'}]`;
      case 'sticker': return '[Sticker]';
      default: return '[Message]';
    }
  }
}

// Webhook Types
interface WhatsAppWebhookPayload {
  entry: Array<{
    changes: Array<{
      field: string;
      value: {
        metadata: { phone_number_id: string };
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
        messages?: WhatsAppMessage[];
      };
    }>;
  }>;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  context?: { id?: string };
  text?: { body: string };
  image?: { id: string; caption?: string };
  video?: { id: string; caption?: string };
  audio?: { id: string };
  document?: { id: string; filename?: string; caption?: string };
  location?: { latitude: number; longitude: number; name?: string };
  contacts?: Array<{ name: { formatted_name: string } }>;
}
