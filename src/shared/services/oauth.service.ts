import { injectable } from 'tsyringe';
import crypto from 'crypto';
import axios from 'axios';
import {
  IOAuthService,
  OAuthState,
  OAuthCallbackResult,
  OAuthTokens,
  OAuthUserInfo,
} from '../../modules/auth/interfaces/oauth-service.interface';
import { appConfig } from '../../config/app.config';

/**
 * Meta OAuth Service
 * Handles OAuth 2.0 flow for WhatsApp Business and Instagram
 * 
 * IMPORTANT: This uses Meta's Embedded Signup flow where:
 * - SellMate (your app) has ONE Meta App ID
 * - Each seller connects THEIR OWN WhatsApp/Instagram accounts
 * - Tokens are per-user, not per-platform
 */
@injectable()
export class OAuthService implements IOAuthService {
  private readonly stateStore = new Map<string, OAuthState>();
  private readonly stateExpiryMs = 10 * 60 * 1000; // 10 minutes

  // Meta API Configuration (2024)
  private readonly META_GRAPH_VERSION = 'v18.0';
  private readonly META_AUTH_URL = 'https://www.facebook.com';
  private readonly META_GRAPH_URL = 'https://graph.facebook.com';

  constructor() {
    // Clean up expired states every 5 minutes
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);
  }

  async generateState(userId: string, platform: 'whatsapp' | 'instagram'): Promise<string> {
    const nonce = crypto.randomBytes(16).toString('hex');
    const state = crypto.randomBytes(32).toString('hex');

    const stateData: OAuthState = {
      userId,
      platform,
      timestamp: Date.now(),
      nonce,
    };

    this.stateStore.set(state, stateData);

    // Auto-cleanup this state after expiry
    setTimeout(() => {
      this.stateStore.delete(state);
    }, this.stateExpiryMs);

    return state;
  }

  async validateState(state: string): Promise<{ valid: boolean; data?: OAuthState; error?: string }> {
    const stateData = this.stateStore.get(state);

    if (!stateData) {
      return { valid: false, error: 'Invalid or expired state parameter' };
    }

    // Check if state has expired
    if (Date.now() - stateData.timestamp > this.stateExpiryMs) {
      this.stateStore.delete(state);
      return { valid: false, error: 'State parameter has expired' };
    }

    return { valid: true, data: stateData };
  }

  /**
   * Generate OAuth authorization URL for Meta platforms
   * Both WhatsApp and Instagram use Facebook Login OAuth
   */
  generateAuthUrl(platform: 'whatsapp' | 'instagram', state: string, scopes: string[]): string {
    const appId = appConfig.social.whatsapp.appId; // Same Meta App for both

    if (!appId) {
      throw new Error('Meta App ID not configured');
    }

    const redirectUri = this.getRedirectUri(platform);

    // Meta OAuth 2.0 authorization endpoint
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state,
      // For WhatsApp Business, we need to specify the config_id for Embedded Signup
      ...(platform === 'whatsapp' && {
        config_id: process.env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || '',
      }),
    });

    return `${this.META_AUTH_URL}/${this.META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Handle OAuth callback - exchange code for tokens
   * Note: State validation should be done by the caller before calling this method
   */
  async handleCallback(
    platform: 'whatsapp' | 'instagram',
    code: string,
    state: string
  ): Promise<OAuthCallbackResult> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(platform, code);
      if (!tokens) {
        return { success: false, error: 'Failed to exchange code for tokens' };
      }

      // Get user/business info based on platform
      const userInfo = await this.getBusinessInfo(platform, tokens.accessToken);

      // Clean up state after successful callback
      this.stateStore.delete(state);

      return {
        success: true,
        tokens,
        userInfo,
      };
    } catch (error) {
      console.error(`OAuth callback error for ${platform}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForTokens(
    platform: 'whatsapp' | 'instagram',
    code: string
  ): Promise<OAuthTokens | null> {
    try {
      const appId = appConfig.social.whatsapp.appId;
      const appSecret = appConfig.social.whatsapp.appSecret;
      const redirectUri = this.getRedirectUri(platform);

      if (!appId || !appSecret) {
        throw new Error('Meta App credentials not configured');
      }

      // Meta OAuth token endpoint
      const tokenUrl = `${this.META_GRAPH_URL}/${this.META_GRAPH_VERSION}/oauth/access_token`;

      const response = await axios.get(tokenUrl, {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      });

      const { access_token } = response.data;

      // For long-lived token, exchange short-lived token
      const longLivedToken = await this.exchangeForLongLivedToken(access_token);

      return {
        accessToken: longLivedToken.accessToken,
        refreshToken: undefined, // Meta doesn't use refresh tokens, tokens are long-lived
        expiresIn: longLivedToken.expiresIn,
        scope: response.data.scope,
      };
    } catch (error: any) {
      console.error(`Token exchange error for ${platform}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  private async exchangeForLongLivedToken(
    shortLivedToken: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const appId = appConfig.social.whatsapp.appId;
      const appSecret = appConfig.social.whatsapp.appSecret;

      const response = await axios.get(
        `${this.META_GRAPH_URL}/${this.META_GRAPH_VERSION}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: shortLivedToken,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5184000, // Default 60 days
      };
    } catch (error) {
      console.error('Long-lived token exchange failed:', error);
      // Return original token if exchange fails
      return {
        accessToken: shortLivedToken,
        expiresIn: 3600, // 1 hour for short-lived
      };
    }
  }

  /**
   * Refresh token - For Meta, we need to exchange for a new long-lived token
   * before the current one expires
   */
  async refreshToken(
    platform: 'whatsapp' | 'instagram',
    currentToken: string
  ): Promise<OAuthCallbackResult> {
    try {
      // Meta doesn't have traditional refresh tokens
      // Instead, exchange the current token for a new long-lived token
      const newToken = await this.exchangeForLongLivedToken(currentToken);

      return {
        success: true,
        tokens: {
          accessToken: newToken.accessToken,
          expiresIn: newToken.expiresIn,
        },
      };
    } catch (error) {
      console.error(`Token refresh error for ${platform}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(platform: 'whatsapp' | 'instagram', accessToken: string): Promise<boolean> {
    try {
      // Delete all permissions for this token
      await axios.delete(
        `${this.META_GRAPH_URL}/${this.META_GRAPH_VERSION}/me/permissions`,
        {
          params: { access_token: accessToken },
        }
      );
      return true;
    } catch (error) {
      console.error(`Token revocation error for ${platform}:`, error);
      return false;
    }
  }

  /**
   * Get business account info based on platform
   */
  private async getBusinessInfo(
    platform: 'whatsapp' | 'instagram',
    accessToken: string
  ): Promise<OAuthUserInfo | undefined> {
    try {
      if (platform === 'whatsapp') {
        return await this.getWhatsAppBusinessInfo(accessToken);
      } else {
        return await this.getInstagramBusinessInfo(accessToken);
      }
    } catch (error) {
      console.error(`Business info fetch error for ${platform}:`, error);
      return undefined;
    }
  }

  /**
   * Get WhatsApp Business Account info
   */
  private async getWhatsAppBusinessInfo(accessToken: string): Promise<OAuthUserInfo | undefined> {
    try {
      // First, get the user's WhatsApp Business Accounts
      const response = await axios.get(
        `${this.META_GRAPH_URL}/${this.META_GRAPH_VERSION}/me/businesses`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,whatsapp_business_accounts{id,name,phone_numbers}',
          },
        }
      );

      const businesses = response.data.data;
      if (!businesses || businesses.length === 0) {
        return undefined;
      }

      // Get the first WhatsApp Business Account
      const business = businesses[0];
      const wabaAccounts = business.whatsapp_business_accounts?.data;

      if (!wabaAccounts || wabaAccounts.length === 0) {
        return undefined;
      }

      const waba = wabaAccounts[0];

      return {
        id: waba.id,
        name: waba.name || business.name,
        email: undefined,
        profilePicture: undefined,
      };
    } catch (error: any) {
      console.error('WhatsApp business info error:', error.response?.data || error.message);
      return undefined;
    }
  }

  /**
   * Get Instagram Business Account info
   */
  private async getInstagramBusinessInfo(accessToken: string): Promise<OAuthUserInfo | undefined> {
    try {
      // Get user's Facebook Pages first
      const pagesResponse = await axios.get(
        `${this.META_GRAPH_URL}/${this.META_GRAPH_VERSION}/me/accounts`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,instagram_business_account{id,username,profile_picture_url}',
          },
        }
      );

      const pages = pagesResponse.data.data;
      if (!pages || pages.length === 0) {
        return undefined;
      }

      // Find a page with Instagram Business Account
      const pageWithInstagram = pages.find((page: any) => page.instagram_business_account);

      if (!pageWithInstagram) {
        return undefined;
      }

      const igAccount = pageWithInstagram.instagram_business_account;

      return {
        id: igAccount.id,
        name: igAccount.username,
        email: undefined,
        profilePicture: igAccount.profile_picture_url,
      };
    } catch (error: any) {
      console.error('Instagram business info error:', error.response?.data || error.message);
      return undefined;
    }
  }

  /**
   * Get redirect URI for OAuth callback
   */
  private getRedirectUri(platform: 'whatsapp' | 'instagram'): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/api/v1/auth/oauth/${platform}/callback`;
  }

  /**
   * Get base URL for callbacks
   */
  private getBaseUrl(): string {
    // Use environment variable in production
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }

    if (appConfig.isDevelopment) {
      return `http://localhost:${appConfig.port}`;
    }

    return `https://api.sellmate.com`; // Replace with your production domain
  }

  /**
   * Clean up expired state parameters
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (now - data.timestamp > this.stateExpiryMs) {
        this.stateStore.delete(state);
      }
    }
  }
}