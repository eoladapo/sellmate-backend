export interface OAuthState {
  userId?: string;
  platform: 'whatsapp' | 'instagram';
  timestamp: number;
  nonce: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  name?: string;
  email?: string;
  profilePicture?: string;
}

export interface OAuthInitiationResult {
  success: boolean;
  authUrl?: string;
  state?: string;
  error?: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  tokens?: OAuthTokens;
  userInfo?: OAuthUserInfo;
  error?: string;
}

export interface IOAuthService {
  /**
   * Generate secure state parameter for OAuth flow
   */
  generateState(userId: string, platform: 'whatsapp' | 'instagram'): Promise<string>;

  /**
   * Validate state parameter from OAuth callback
   */
  validateState(state: string): Promise<{ valid: boolean; data?: OAuthState; error?: string }>;

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(platform: 'whatsapp' | 'instagram', state: string, scopes: string[]): string;

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  handleCallback(
    platform: 'whatsapp' | 'instagram',
    code: string,
    state: string
  ): Promise<OAuthCallbackResult>;

  /**
   * Refresh OAuth access token
   */
  refreshToken(
    platform: 'whatsapp' | 'instagram',
    refreshToken: string
  ): Promise<OAuthCallbackResult>;

  /**
   * Revoke OAuth tokens
   */
  revokeToken(platform: 'whatsapp' | 'instagram', accessToken: string): Promise<boolean>;
}
