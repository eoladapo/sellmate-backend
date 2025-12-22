/**
 * Sensitive Data Encryption Helper
 * Provides encryption for sensitive fields like phone numbers, tokens, etc.
 * Requirements: 8.2, 8.3
 */

import crypto from 'crypto';
import { appConfig } from '../../../config/app.config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derive encryption key from master key using PBKDF2
 * This adds an extra layer of security by deriving unique keys
 */
function deriveKey(salt: Buffer, context: string): Buffer {
  const masterKey = appConfig.encryption.key;
  return crypto.pbkdf2Sync(
    masterKey,
    Buffer.concat([salt, Buffer.from(context)]),
    100000, // iterations
    32, // key length
    'sha256'
  );
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @param context - Context string for key derivation (e.g., 'phone', 'token')
 * @returns Base64 encoded encrypted data
 */
export function encryptSensitiveData(plaintext: string, context: string = 'default'): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(salt, context);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(context, 'utf8'));

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine: salt + iv + encrypted data + auth tag
    const combined = Buffer.concat([
      salt,
      iv,
      Buffer.from(encrypted, 'hex'),
      tag,
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param encryptedData - Base64 encoded encrypted data
 * @param context - Context string used during encryption
 * @returns Decrypted plaintext
 */
export function decryptSensitiveData(encryptedData: string, context: string = 'default'): string {
  try {
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH, combined.length - TAG_LENGTH);

    const key = deriveKey(salt, context);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(context, 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Encrypt phone number
 */
export function encryptPhoneNumber(phoneNumber: string): string {
  return encryptSensitiveData(phoneNumber, 'phone');
}

/**
 * Decrypt phone number
 */
export function decryptPhoneNumber(encryptedPhone: string): string {
  return decryptSensitiveData(encryptedPhone, 'phone');
}

/**
 * Encrypt API token
 */
export function encryptApiToken(token: string): string {
  return encryptSensitiveData(token, 'api-token');
}

/**
 * Decrypt API token
 */
export function decryptApiToken(encryptedToken: string): string {
  return decryptSensitiveData(encryptedToken, 'api-token');
}

/**
 * Encrypt personal data (name, email, etc.)
 */
export function encryptPersonalData(data: string): string {
  return encryptSensitiveData(data, 'personal');
}

/**
 * Decrypt personal data
 */
export function decryptPersonalData(encryptedData: string): string {
  return decryptSensitiveData(encryptedData, 'personal');
}
