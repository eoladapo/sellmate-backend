import { IOAuthService } from '../interfaces/oauth-service.interface';
import { IOAuthTokenRepository } from '../interfaces/oauth-token-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { encryptOAuthToken, decryptOAuthToken } from '../../../shared/helpers/encryption';

export interface WhatsAppOAuthResult {
  success: boolean;
  user?: {
    id: string;
    phoneNumber: string;
    businessName: string;
    connectedPlatforms: {
      whatsapp: { connected: boolean; accountId?: string };
      instagram: { connected: boolean; accountId?: string };
    };
  };
  error?: string;
}

export class WhatsAppOAuthService {
  // Meta OAuth Scopes for WhatsApp Business API (2024)
  // These permissions allow SellMate to manage the seller's WhatsApp Business
  private readonly whatsappScopes = [
    'whatsapp_business_management', // Manage WhatsApp Business Account
    'whatsapp_business_messaging',  // Send/receive messages
    'business_management',          // Access business info
  ];

  constructor(
    private oauthService: IOAuthService,
    private oauthTokenRepository: IOAuthTokenRepository,
    private userRepository: IUserRepository
  ) { }

  async initiateOAuth(userId: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      // Generate state parameter
      const state = await this.oauthService.generateState(userId, 'whatsapp');

      // Generate authorization URL
      const authUrl = this.oauthService.generateAuthUrl('whatsapp', state, this.whatsappScopes);

      return {
        success: true,
        authUrl,
      };
    } catch (error) {
      console.error('WhatsApp OAuth initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate WhatsApp OAuth',
      };
    }
  }

  async handleCallback(code: string, state: string): Promise<WhatsAppOAuthResult> {
    try {
      // Validate state FIRST and get user ID (before handleCallback deletes it)
      const stateValidation = await this.oauthService.validateState(state);
      if (!stateValidation.valid || !stateValidation.data?.userId) {
        return {
          success: false,
          error: stateValidation.error || 'Invalid state parameter',
        };
      }

      const userId = stateValidation.data.userId;

      // Handle OAuth callback (exchange code for tokens)
      const callbackResult = await this.oauthService.handleCallback('whatsapp', code, state);

      if (!callbackResult.success || !callbackResult.tokens) {
        return {
          success: false,
          error: callbackResult.error || 'OAuth callback failed',
        };
      }

      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Encrypt and store tokens
      const encryptedAccessToken = encryptOAuthToken(callbackResult.tokens.accessToken);
      const encryptedRefreshToken = callbackResult.tokens.refreshToken
        ? encryptOAuthToken(callbackResult.tokens.refreshToken)
        : undefined;

      // Calculate expiry date
      const expiresAt = callbackResult.tokens.expiresIn
        ? new Date(Date.now() + callbackResult.tokens.expiresIn * 1000)
        : undefined;

      // Store OAuth token
      await this.oauthTokenRepository.upsert({
        userId,
        platform: 'whatsapp',
        encryptedAccessToken,
        encryptedRefreshToken,
        businessAccountId: callbackResult.userInfo?.id,
        businessAccountName: callbackResult.userInfo?.name,
        scope: callbackResult.tokens.scope,
        expiresAt,
      });

      // Update user's connected platforms
      const updatedConnectedPlatforms = {
        ...user.connectedPlatforms,
        whatsapp: {
          connected: true,
          businessAccountId: callbackResult.userInfo?.id,
          connectedAt: new Date(),
        },
      };

      await this.userRepository.update(userId, {
        connectedPlatforms: updatedConnectedPlatforms,
      });

      // Return updated user data
      const updatedUser = await this.userRepository.findById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return {
        success: true,
        user: {
          id: updatedUser.id,
          phoneNumber: updatedUser.phoneNumber,
          businessName: updatedUser.businessName,
          connectedPlatforms: updatedUser.connectedPlatforms,
        },
      };
    } catch (error) {
      console.error('WhatsApp OAuth callback error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'WhatsApp OAuth callback failed',
      };
    }
  }

  async refreshToken(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get stored token
      const storedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'whatsapp');
      if (!storedToken || !storedToken.encryptedRefreshToken) {
        return {
          success: false,
          error: 'No refresh token found',
        };
      }

      // Decrypt refresh token
      const refreshToken = decryptOAuthToken(storedToken.encryptedRefreshToken);

      // Refresh token
      const refreshResult = await this.oauthService.refreshToken('whatsapp', refreshToken);
      if (!refreshResult.success || !refreshResult.tokens) {
        return {
          success: false,
          error: refreshResult.error || 'Token refresh failed',
        };
      }

      // Encrypt and update tokens
      const encryptedAccessToken = encryptOAuthToken(refreshResult.tokens.accessToken);
      const encryptedRefreshToken = refreshResult.tokens.refreshToken
        ? encryptOAuthToken(refreshResult.tokens.refreshToken)
        : storedToken.encryptedRefreshToken;

      const expiresAt = refreshResult.tokens.expiresIn
        ? new Date(Date.now() + refreshResult.tokens.expiresIn * 1000)
        : undefined;

      await this.oauthTokenRepository.update(storedToken.id, {
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
      });

      return { success: true };
    } catch (error) {
      console.error('WhatsApp token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  async disconnect(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get stored token
      const storedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'whatsapp');
      if (storedToken) {
        // Decrypt access token for revocation
        const accessToken = decryptOAuthToken(storedToken.encryptedAccessToken);

        // Revoke token with WhatsApp
        await this.oauthService.revokeToken('whatsapp', accessToken);

        // Delete stored token
        await this.oauthTokenRepository.delete(userId, 'whatsapp');
      }

      // Update user's connected platforms
      const user = await this.userRepository.findById(userId);
      if (user) {
        const updatedConnectedPlatforms = {
          ...user.connectedPlatforms,
          whatsapp: {
            connected: false,
          },
        };

        await this.userRepository.update(userId, {
          connectedPlatforms: updatedConnectedPlatforms,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('WhatsApp disconnect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      };
    }
  }

  async getAccessToken(userId: string): Promise<string | null> {
    try {
      const storedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'whatsapp');
      if (!storedToken) {
        return null;
      }

      // Check if token is expired
      if (storedToken.expiresAt && storedToken.expiresAt <= new Date()) {
        // Try to refresh token
        const refreshResult = await this.refreshToken(userId);
        if (!refreshResult.success) {
          return null;
        }

        // Get updated token
        const updatedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'whatsapp');
        if (!updatedToken) {
          return null;
        }

        return decryptOAuthToken(updatedToken.encryptedAccessToken);
      }

      return decryptOAuthToken(storedToken.encryptedAccessToken);
    } catch (error) {
      console.error('Error getting WhatsApp access token:', error);
      return null;
    }
  }
}