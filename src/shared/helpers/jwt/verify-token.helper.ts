import * as jwt from 'jsonwebtoken';

export interface TokenVerificationResult<T = any> {
  valid: boolean;
  payload?: T;
  error?: string;
  expired?: boolean;
}

/**
 * Verify a JWT token
 * @param token - The JWT token to verify
 * @param secret - The secret to verify against
 * @returns TokenVerificationResult - The verification result
 */
export function verifyToken<T = any>(token: string, secret: string): TokenVerificationResult<T> {
  try {
    const payload = jwt.verify(token, secret, {
      issuer: 'sellmate-platform',
      audience: 'sellmate-users',
    }) as T;

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        expired: true,
        error: 'Token has expired',
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      };
    }

    return {
      valid: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * Verify an access token
 * @param token - The access token to verify
 * @returns TokenVerificationResult - The verification result
 */
export function verifyAccessToken(token: string): TokenVerificationResult {
  const { appConfig } = require('../../../config/app.config');
  return verifyToken(token, appConfig.jwt.accessSecret);
}

/**
 * Verify a refresh token
 * @param token - The refresh token to verify
 * @returns TokenVerificationResult - The verification result
 */
export function verifyRefreshToken(token: string): TokenVerificationResult {
  const { appConfig } = require('../../../config/app.config');
  return verifyToken(token, appConfig.jwt.refreshSecret);
}