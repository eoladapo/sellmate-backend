import * as bcrypt from 'bcrypt';

/**
 * Hash a refresh token using bcrypt
 * @param token - The refresh token to hash
 * @returns Promise<string> - The hashed token
 */
export async function hashRefreshToken(token: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(token, saltRounds);
}