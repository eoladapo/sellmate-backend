import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { appConfig } from '../../../config/app.config';

export interface AccessTokenPayload {
  userId: string;
  phoneNumber: string;
}

/**
 * Generate an access token with 15-minute expiry
 * @param payload - The token payload
 * @returns string - The signed JWT token
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, appConfig.jwt.accessSecret, {
    expiresIn: `${appConfig.jwt.accessTokenExpiry}s`,
    issuer: 'sellmate-platform',
    audience: 'sellmate-users',
    jwtid: randomUUID(), // Add unique JWT ID for blacklisting
  });
}