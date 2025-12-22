import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { appConfig } from '../../../config/app.config';

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

/**
 * Generate a refresh token with 7-day expiry
 * @param payload - The token payload
 * @returns string - The signed JWT token
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, appConfig.jwt.refreshSecret, {
    expiresIn: `${appConfig.jwt.refreshTokenExpiry}s`,
    issuer: 'sellmate-platform',
    audience: 'sellmate-users',
    jwtid: randomUUID(), // Add unique JWT ID for blacklisting
  });
}