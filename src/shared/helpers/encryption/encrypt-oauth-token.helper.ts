import crypto from 'crypto';
import { appConfig } from '../../../config/app.config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt OAuth token using AES-256-GCM
 */
export function encryptOAuthToken(token: string): string {
  try {
    const key = Buffer.from(appConfig.encryption.key, 'utf8').subarray(0, 32); // Ensure 32 bytes for AES-256
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('oauth-token', 'utf8'));

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      tag,
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Token encryption error:', error);
    throw new Error('Failed to encrypt OAuth token');
  }
}

/**
 * Decrypt OAuth token using AES-256-GCM
 */
export function decryptOAuthToken(encryptedToken: string): string {
  try {
    const key = Buffer.from(appConfig.encryption.key, 'utf8').subarray(0, 32); // Ensure 32 bytes for AES-256
    const combined = Buffer.from(encryptedToken, 'base64');

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('oauth-token', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error);
    throw new Error('Failed to decrypt OAuth token');
  }
}