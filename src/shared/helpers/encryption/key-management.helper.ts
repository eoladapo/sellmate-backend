/**
 * Encryption Key Management Helper
 * Provides utilities for managing encryption keys
 * Requirements: 8.2, 8.3
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure encryption key
 * @param length - Key length in bytes (default: 32 for AES-256)
 * @returns Hex-encoded key
 */
export function generateEncryptionKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure random string for secrets
 * @param length - Length of the string
 * @returns Base64-encoded random string
 */
export function generateSecureSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Validate encryption key format and strength
 * @param key - The key to validate
 * @param minLength - Minimum required length in characters
 * @returns Validation result
 */
export function validateEncryptionKey(key: string, minLength: number = 32): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!key) {
    errors.push('Encryption key is required');
    return { isValid: false, errors };
  }

  if (key.length < minLength) {
    errors.push(`Encryption key must be at least ${minLength} characters`);
  }

  // Check for weak patterns
  const weakPatterns = [
    /^(.)\1+$/, // All same character
    /^(012|123|234|345|456|567|678|789|890)+$/, // Sequential numbers
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // Sequential letters
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(key)) {
      errors.push('Encryption key contains weak patterns');
      break;
    }
  }

  // Check entropy (rough estimate)
  const uniqueChars = new Set(key).size;
  const entropyRatio = uniqueChars / key.length;
  if (entropyRatio < 0.3) {
    errors.push('Encryption key has low entropy (too repetitive)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Derive a key from a password using PBKDF2
 * @param password - The password to derive from
 * @param salt - Salt for key derivation (or generate new)
 * @param iterations - Number of iterations (default: 100000)
 * @returns Object containing derived key and salt
 */
export function deriveKeyFromPassword(
  password: string,
  salt?: string,
  iterations: number = 100000
): { key: string; salt: string } {
  const saltBuffer = salt
    ? Buffer.from(salt, 'hex')
    : crypto.randomBytes(32);

  const derivedKey = crypto.pbkdf2Sync(
    password,
    saltBuffer,
    iterations,
    32, // 256 bits
    'sha256'
  );

  return {
    key: derivedKey.toString('hex'),
    salt: saltBuffer.toString('hex'),
  };
}

/**
 * Hash a key for storage (when you need to verify but not decrypt)
 * @param key - The key to hash
 * @returns Hashed key
 */
export function hashKey(key: string): string {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
}

/**
 * Compare a key with its hash (timing-safe)
 * @param key - The key to compare
 * @param hash - The hash to compare against
 * @returns Whether they match
 */
export function compareKeyHash(key: string, hash: string): boolean {
  const keyHash = hashKey(key);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(keyHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Rotate encryption key (re-encrypt data with new key)
 * This is a utility function - actual implementation depends on data storage
 */
export interface KeyRotationResult {
  newKey: string;
  oldKeyHash: string;
  rotatedAt: Date;
}

export function prepareKeyRotation(oldKey: string): KeyRotationResult {
  return {
    newKey: generateEncryptionKey(),
    oldKeyHash: hashKey(oldKey),
    rotatedAt: new Date(),
  };
}

/**
 * Generate a key pair for asymmetric encryption
 * @returns Object containing public and private keys
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}

/**
 * Encrypt data with public key (for secure key exchange)
 */
export function encryptWithPublicKey(data: string, publicKey: string): string {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(data)
  );

  return encrypted.toString('base64');
}

/**
 * Decrypt data with private key
 */
export function decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedData, 'base64')
  );

  return decrypted.toString('utf8');
}
