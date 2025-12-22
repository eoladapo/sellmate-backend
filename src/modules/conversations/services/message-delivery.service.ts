import { DataSource } from 'typeorm';
import { Message } from '../entities';
import { MessageRepository } from '../repositories/message.repository';
import { IntegrationConnectionRepository } from '../../integrations/repositories';
import { OAuthTokenRepository } from '../../auth/repositories/oauth-token.repository';
import { WhatsAppIntegrationService } from '../../integrations/services/whatsapp-integration.service';
import { InstagramIntegrationService } from '../../integrations/services/instagram-integration.service';
import { Platform, MessageType, MessageStatus, ConnectionStatus } from '../../integrations/enums';
import { SendMessageResponse } from '../../integrations/interfaces';
import { decryptOAuthToken } from '../../../shared/helpers/encryption';

/**
 * Message delivery result
 */
export interface MessageDeliveryResult {
  success: boolean;
  platformMessageId?: string;
  deliveredAt?: Date;
  error?: string;
  status: MessageStatus;
}

/**
 * Message Delivery Service
 * Handles sending messages through platform APIs (WhatsApp/Instagram)
 */
export class MessageDeliveryService {
  private messageRepository: MessageRepository;
  private integrationConnectionRepository: IntegrationConnectionRepository;
  private oauthTokenRepository: OAuthTokenRepository;

  constructor(dataSource: DataSource) {
    this.messageRepository = new MessageRepository(dataSource);
    this.integrationConnectionRepository = new IntegrationConnectionRepository(dataSource);
    this.oauthTokenRepository = new OAuthTokenRepository(dataSource);
  }

  /**
   * Send a message through the appropriate platform API
   */
  async sendMessage(
    userId: string,
    message: Message,
    recipientId: string
  ): Promise<MessageDeliveryResult> {
    const platform = message.platform;

    // Check if platform is connected
    const connection = await this.integrationConnectionRepository.findByUserAndPlatform(
      userId,
      platform
    );

    if (!connection || connection.status !== ConnectionStatus.CONNECTED) {
      // Platform not connected - message saved locally only (Lite Mode behavior)
      return {
        success: true,
        status: MessageStatus.PENDING,
        error: `${platform} is not connected. Message saved locally.`,
      };
    }

    // Get OAuth token
    const oauthToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, platform);
    if (!oauthToken) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: `No OAuth token found for ${platform}`,
      };
    }

    try {
      // Initialize the appropriate integration service
      const integrationService = this.createIntegrationService(platform);

      await integrationService.initialize({
        platform,
        userId,
        businessAccountId: oauthToken.businessAccountId || '',
        accessToken: decryptOAuthToken(oauthToken.encryptedAccessToken),
      });

      // Send the message
      const response: SendMessageResponse = await integrationService.sendMessage({
        recipientId,
        content: message.content,
        type: MessageType.TEXT,
      });

      if (response.success) {
        // Update message with platform message ID and status
        await this.messageRepository.update(message.id, {
          platformMessageId: response.platformMessageId,
          status: MessageStatus.SENT,
        });

        return {
          success: true,
          platformMessageId: response.platformMessageId,
          deliveredAt: response.timestamp,
          status: MessageStatus.SENT,
        };
      } else {
        // Update message status to failed
        await this.messageRepository.updateStatus(message.id, MessageStatus.FAILED);

        return {
          success: false,
          status: MessageStatus.FAILED,
          error: response.error || 'Failed to send message',
        };
      }
    } catch (error) {
      // Update message status to failed
      await this.messageRepository.updateStatus(message.id, MessageStatus.FAILED);

      return {
        success: false,
        status: MessageStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error sending message',
      };
    }
  }

  /**
   * Retry sending a failed message
   */
  async retryMessage(
    userId: string,
    messageId: string,
    recipientId: string
  ): Promise<MessageDeliveryResult> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: 'Message not found',
      };
    }

    if (message.status !== MessageStatus.FAILED) {
      return {
        success: false,
        status: message.status,
        error: 'Message is not in failed state',
      };
    }

    // Reset status to pending before retry
    await this.messageRepository.updateStatus(messageId, MessageStatus.PENDING);

    return this.sendMessage(userId, message, recipientId);
  }

  /**
   * Check if platform is available for sending messages
   */
  async isPlatformAvailable(userId: string, platform: Platform): Promise<boolean> {
    const connection = await this.integrationConnectionRepository.findByUserAndPlatform(
      userId,
      platform
    );

    return connection?.status === ConnectionStatus.CONNECTED;
  }

  /**
   * Create the appropriate integration service based on platform
   */
  private createIntegrationService(
    platform: Platform
  ): WhatsAppIntegrationService | InstagramIntegrationService {
    switch (platform) {
      case Platform.WHATSAPP:
        return new WhatsAppIntegrationService();
      case Platform.INSTAGRAM:
        return new InstagramIntegrationService();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}
