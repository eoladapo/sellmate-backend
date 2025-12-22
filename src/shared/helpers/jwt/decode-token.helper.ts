import * as jwt from 'jsonwebtoken';

/**
 * Decode a JWT token without verification (for inspection purposes)
 * @param token - The JWT token to decode
 * @returns any - The decoded payload or null if invalid
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}