import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TOKENS } from '../../../di/tokens';
import { Platform, ConnectionStatus } from '../enums';
import { IntegrationConnectionRepository } from '../repositories';
import { WhatsAppIntegrationService } from '../services/whatsapp-integration.service';
import { InstagramIntegrationService } from '../services/instagram-integration.service';
import { OAuthTokenRepository } from '../../auth/repositories/oauth-token.repository';
import { decryptOAuthToken } from '../../../shared/helpers/encryption';

/**
 * Integration Controller
 * Handles integration management endpoints
 */
@injectable()
export class IntegrationController {
  constructor(
    @inject(TOKENS.IntegrationConnectionRepository) private connectionRepository: IntegrationConnectionRepository,
    @inject(TOKENS.OAuthTokenRepository) private oauthTokenRepository: OAuthTokenRepository
  ) { }

  /**
   * Get status of all integrations for the authenticated user
   */
  async getIntegrationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const connections = await this.connectionRepository.findByUser(userId);

      const statuses = {
        whatsapp: this.formatConnectionStatus(
          connections.find(c => c.platform === Platform.WHATSAPP)
        ),
        instagram: this.formatConnectionStatus(
          connections.find(c => c.platform === Platform.INSTAGRAM)
        ),
      };

      res.status(200).json({
        success: true,
        data: statuses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connect WhatsApp integration
   */
  async connectWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { businessAccountId, accessToken } = req.body;

      // Validate required fields
      if (!businessAccountId || !accessToken) {
        res.status(400).json({
          success: false,
          error: 'Business account ID and access token are required',
        });
        return;
      }

      // Initialize WhatsApp service to validate credentials
      const service = new WhatsAppIntegrationService();

      try {
        await service.initialize({
          platform: Platform.WHATSAPP,
          userId,
          businessAccountId,
          accessToken,
        });
      } catch (initError) {
        res.status(400).json({
          success: false,
          error: `Failed to connect WhatsApp: ${initError instanceof Error ? initError.message : 'Unknown error'}`,
        });
        return;
      }

      // Perform health check
      const health = await service.healthCheck();
      if (!health.isHealthy) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp connection health check failed',
          details: health.errors,
        });
        return;
      }

      // Save connection status
      await this.connectionRepository.upsert({
        userId,
        platform: Platform.WHATSAPP,
        status: ConnectionStatus.CONNECTED,
        businessAccountId,
        connectedAt: new Date(),
        settings: {
          autoSync: true,
          syncIntervalMinutes: 5,
          notifyOnNewMessage: true,
          notifyOnStatusChange: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'WhatsApp connected successfully',
        data: {
          platform: Platform.WHATSAPP,
          status: ConnectionStatus.CONNECTED,
          businessAccountId,
          connectedAt: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect WhatsApp integration
   */
  async disconnectWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      // Update connection status
      await this.connectionRepository.updateStatus(
        userId,
        Platform.WHATSAPP,
        ConnectionStatus.DISCONNECTED
      );

      // Deactivate OAuth token
      await this.oauthTokenRepository.deactivate(userId, 'whatsapp');

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connect Instagram integration
   */
  async connectInstagram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { businessAccountId, accessToken } = req.body;

      if (!businessAccountId || !accessToken) {
        res.status(400).json({
          success: false,
          error: 'Business account ID and access token are required',
        });
        return;
      }

      // Initialize Instagram service to validate credentials
      const service = new InstagramIntegrationService();

      try {
        await service.initialize({
          platform: Platform.INSTAGRAM,
          userId,
          businessAccountId,
          accessToken,
        });
      } catch (initError) {
        res.status(400).json({
          success: false,
          error: `Failed to connect Instagram: ${initError instanceof Error ? initError.message : 'Unknown error'}`,
        });
        return;
      }

      // Perform health check
      const health = await service.healthCheck();
      if (!health.isHealthy) {
        res.status(400).json({
          success: false,
          error: 'Instagram connection health check failed',
          details: health.errors,
        });
        return;
      }

      // Save connection status
      await this.connectionRepository.upsert({
        userId,
        platform: Platform.INSTAGRAM,
        status: ConnectionStatus.CONNECTED,
        businessAccountId,
        connectedAt: new Date(),
        settings: {
          autoSync: true,
          syncIntervalMinutes: 5,
          syncComments: false,
          notifyOnNewMessage: true,
          notifyOnStatusChange: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Instagram connected successfully',
        data: {
          platform: Platform.INSTAGRAM,
          status: ConnectionStatus.CONNECTED,
          businessAccountId,
          connectedAt: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect Instagram integration
   */
  async disconnectInstagram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      await this.connectionRepository.updateStatus(
        userId,
        Platform.INSTAGRAM,
        ConnectionStatus.DISCONNECTED
      );

      await this.oauthTokenRepository.deactivate(userId, 'instagram');

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger manual sync for a platform
   */
  async triggerSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { platform } = req.body;

      if (!platform || !Object.values(Platform).includes(platform)) {
        res.status(400).json({
          success: false,
          error: 'Valid platform is required (whatsapp or instagram)',
        });
        return;
      }

      // Get connection and OAuth token
      const connection = await this.connectionRepository.findByUserAndPlatform(userId, platform);
      if (!connection || connection.status !== ConnectionStatus.CONNECTED) {
        res.status(400).json({
          success: false,
          error: `${platform} is not connected`,
        });
        return;
      }

      const oauthToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, platform);
      if (!oauthToken) {
        res.status(400).json({
          success: false,
          error: `No OAuth token found for ${platform}`,
        });
        return;
      }

      // Check if sync is already in progress
      if (connection.syncInProgress) {
        res.status(409).json({
          success: false,
          error: 'Sync already in progress',
        });
        return;
      }

      // Mark sync as in progress
      await this.connectionRepository.setSyncInProgress(userId, platform, true);

      // Initialize appropriate service
      const service = platform === Platform.WHATSAPP
        ? new WhatsAppIntegrationService()
        : new InstagramIntegrationService();

      try {
        await service.initialize({
          platform,
          userId,
          businessAccountId: oauthToken.businessAccountId || '',
          accessToken: decryptOAuthToken(oauthToken.encryptedAccessToken),
        });

        const result = await service.syncMessages();

        // Update last sync timestamp
        await this.connectionRepository.updateLastSync(userId, platform);

        res.status(200).json({
          success: true,
          data: {
            messagesCount: result.messagesCount,
            conversationsCount: result.conversationsCount,
            lastSyncAt: new Date(),
            hasMore: result.hasMore,
          },
        });
      } catch (syncError) {
        await this.connectionRepository.setSyncInProgress(userId, platform, false);
        throw syncError;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get health status of integrations
   */
  async getHealthStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const connections = await this.connectionRepository.findConnectedByUser(userId);
      const healthResults: Record<string, unknown> = {};

      for (const connection of connections) {
        const oauthToken = await this.oauthTokenRepository.findByUserAndPlatform(
          userId,
          connection.platform
        );

        if (!oauthToken) {
          healthResults[connection.platform] = {
            isHealthy: false,
            error: 'No OAuth token found',
          };
          continue;
        }

        const service = connection.platform === Platform.WHATSAPP
          ? new WhatsAppIntegrationService()
          : new InstagramIntegrationService();

        try {
          await service.initialize({
            platform: connection.platform,
            userId,
            businessAccountId: oauthToken.businessAccountId || '',
            accessToken: decryptOAuthToken(oauthToken.encryptedAccessToken),
          });

          const health = await service.healthCheck();
          healthResults[connection.platform] = health;
        } catch (error) {
          healthResults[connection.platform] = {
            isHealthy: false,
            error: error instanceof Error ? error.message : 'Health check failed',
          };
        }
      }

      res.status(200).json({
        success: true,
        data: healthResults,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Format connection status for API response
   */
  private formatConnectionStatus(connection: {
    status: ConnectionStatus;
    businessAccountId?: string;
    businessAccountName?: string;
    connectedAt?: Date;
    lastSyncAt?: Date;
    lastError?: string;
    tokenExpiresAt?: Date;
  } | undefined): object {
    if (!connection) {
      return {
        connected: false,
        status: ConnectionStatus.DISCONNECTED,
      };
    }

    return {
      connected: connection.status === ConnectionStatus.CONNECTED,
      status: connection.status,
      businessAccountId: connection.businessAccountId,
      businessAccountName: connection.businessAccountName,
      connectedAt: connection.connectedAt,
      lastSyncAt: connection.lastSyncAt,
      lastError: connection.lastError,
      tokenExpiresAt: connection.tokenExpiresAt,
      isTokenExpiringSoon: connection.tokenExpiresAt
        ? connection.tokenExpiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000
        : false,
    };
  }
}
