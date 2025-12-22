export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}