export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResult {
  success: boolean;
  tokens?: AuthTokens;
  error?: string;
}

export interface IJWTService {
  generateTokens(userId: string, phoneNumber: string, deviceInfo: any): Promise<AuthTokens>;
  refreshTokens(refreshToken: string): Promise<RefreshTokenResult>;
  revokeToken(refreshToken: string): Promise<boolean>;
  revokeAllUserTokens(userId: string): Promise<number>;
  validateAccessToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }>;
}