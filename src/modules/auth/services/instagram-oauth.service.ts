import { IOAuthService } from '../interfaces/oauth-service.interface';
import { IOAuthTokenRepository } from '../interfaces/oauth-token-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { encryptOAuthToken, decryptOAuthToken } from '../../../shared/helpers/encryption';

export interface InstagramOAuthResult {
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

export class InstagramOAuthService {
  // Meta OAuth Scopes for Instagram Messaging API (2024)
  // These permissions allow SellMate to manage the seller's Instagram DMs
  private readonly instagramScopes = [
    'instagram_basic',           // Basic Instagram profile info
    'instagram_manage_messages', // Read/send Instagram DMs
    'pages_messaging',           // Required for messaging via Pages
    'pages_manage_metadata',     // Manage Page settings
    'business_management',       // Access business info
  ];

  constructor(
    private oauthService: IOAuthService,
    private oauthTokenRepository: IOAuthTokenRepository,
    private userRepository: IUserRepository
  ) { }

  async initiateOAuth(userId: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      // Generate state parameter
      const state = await this.oauthService.generateState(userId, 'instagram');

      // Generate authorization URL
      const authUrl = this.oauthService.generateAuthUrl('instagram', state, this.instagramScopes);

      return {
        success: true,
        authUrl,
      };
    } catch (error) {
      console.error('Instagram OAuth initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate Instagram OAuth',
      };
    }
  }

  async handleCallback(code: string, state: string): Promise<InstagramOAuthResult> {
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
      const callbackResult = await this.oauthService.handleCallback('instagram', code, state);

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
        platform: 'instagram',
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
        instagram: {
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
      console.error('Instagram OAuth callback error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Instagram OAuth callback failed',
      };
    }
  }

  async refreshToken(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get stored token
      const storedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'instagram');
      if (!storedToken || !storedToken.encryptedRefreshToken) {
        return {
          success: false,
          error: 'No refresh token found',
        };
      }

      // Decrypt refresh token
      const refreshToken = decryptOAuthToken(storedToken.encryptedRefreshToken);

      // Refresh token
      const refreshResult = await this.oauthService.refreshToken('instagram', refreshToken);
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
      console.error('Instagram token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  async disconnect(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get stored token
      const storedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'instagram');
      if (storedToken) {
        // Decrypt access token for revocation
        const accessToken = decryptOAuthToken(storedToken.encryptedAccessToken);

        // Revoke token with Instagram
        await this.oauthService.revokeToken('instagram', accessToken);

        // Delete stored token
        await this.oauthTokenRepository.delete(userId, 'instagram');
      }

      // Update user's connected platforms
      const user = await this.userRepository.findById(userId);
      if (user) {
        const updatedConnectedPlatforms = {
          ...user.connectedPlatforms,
          instagram: {
            connected: false,
          },
        };

        await this.userRepository.update(userId, {
          connectedPlatforms: updatedConnectedPlatforms,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Instagram disconnect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      };
    }
  }

  async getAccessToken(userId: string): Promise<string | null> {
    try {
      const storedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'instagram');
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
        const updatedToken = await this.oauthTokenRepository.findByUserAndPlatform(userId, 'instagram');
        if (!updatedToken) {
          return null;
        }

        return decryptOAuthToken(updatedToken.encryptedAccessToken);
      }

      return decryptOAuthToken(storedToken.encryptedAccessToken);
    } catch (error) {
      console.error('Error getting Instagram access token:', error);
      return null;
    }
  }
}