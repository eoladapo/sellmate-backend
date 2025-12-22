/**
 * Data Masking Helper
 * Provides masking functions for sensitive data in logs
 * Requirements: 8.2, 8.3
 */

/**
 * Mask phone number for logging
 * Shows first 4 and last 2 digits
 * Example: +2348012345678 -> +234****78
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length <= 6) {
    return '****';
  }

  // Handle international format
  if (phone.startsWith('+')) {
    const countryCode = phone.slice(0, 4); // +234
    const lastDigits = phone.slice(-2);
    return `${countryCode}****${lastDigits}`;
  }

  // Handle local format
  const firstDigits = phone.slice(0, 4);
  const lastDigits = phone.slice(-2);
  return `${firstDigits}****${lastDigits}`;
}

/**
 * Mask email address for logging
 * Shows first 2 characters and domain
 * Example: john.doe@example.com -> jo***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***@***.***';
  }

  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2
    ? localPart.slice(0, 2) + '***'
    : '***';

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask credit card number
 * Shows last 4 digits only
 * Example: 4111111111111111 -> ************1111
 */
export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return '****';
  }

  const lastFour = cardNumber.slice(-4);
  const masked = '*'.repeat(cardNumber.length - 4);
  return `${masked}${lastFour}`;
}

/**
 * Mask API token/key
 * Shows first 4 and last 4 characters
 * Example: sk_live_abc123xyz789 -> sk_l****789
 */
export function maskApiToken(token: string): string {
  if (!token || token.length <= 8) {
    return '****';
  }

  const firstPart = token.slice(0, 4);
  const lastPart = token.slice(-4);
  return `${firstPart}****${lastPart}`;
}

/**
 * Mask IP address
 * Shows first two octets only
 * Example: 192.168.1.100 -> 192.168.*.*
 */
export function maskIpAddress(ip: string): string {
  if (!ip) {
    return '*.*.*.*';
  }

  // Handle IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:****`;
    }
    return '****';
  }

  // Handle IPv4
  const octets = ip.split('.');
  if (octets.length === 4) {
    return `${octets[0]}.${octets[1]}.*.*`;
  }

  return '*.*.*.*';
}

/**
 * Mask name
 * Shows first letter and last letter
 * Example: John Doe -> J*** D**
 */
export function maskName(name: string): string {
  if (!name || name.length === 0) {
    return '***';
  }

  const parts = name.split(' ');
  return parts.map(part => {
    if (part.length <= 1) return '*';
    return part[0] + '*'.repeat(part.length - 1);
  }).join(' ');
}

/**
 * Mask address
 * Shows only city/state
 * Example: 123 Main St, Lagos, Nigeria -> ***, Lagos, Nigeria
 */
export function maskAddress(address: string): string {
  if (!address) {
    return '***';
  }

  const parts = address.split(',');
  if (parts.length >= 2) {
    return `***,${parts.slice(-2).join(',')}`;
  }

  return '***';
}

/**
 * Mask object properties recursively
 * Automatically masks sensitive fields in objects
 */
export function maskSensitiveFields(obj: any, sensitiveFields: string[] = []): any {
  const defaultSensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'phoneNumber',
    'phone',
    'email',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurityNumber',
    'bankAccount',
    'accountNumber',
  ];

  const fieldsToMask = [...defaultSensitiveFields, ...sensitiveFields];

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveFields(item, sensitiveFields));
  }

  const masked: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if this field should be masked
    const shouldMask = fieldsToMask.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (shouldMask && typeof value === 'string') {
      // Apply appropriate masking based on field name
      if (lowerKey.includes('phone')) {
        masked[key] = maskPhoneNumber(value);
      } else if (lowerKey.includes('email')) {
        masked[key] = maskEmail(value);
      } else if (lowerKey.includes('card') || lowerKey.includes('credit')) {
        masked[key] = maskCreditCard(value);
      } else if (lowerKey.includes('token') || lowerKey.includes('key') || lowerKey.includes('secret')) {
        masked[key] = maskApiToken(value);
      } else if (lowerKey.includes('ip')) {
        masked[key] = maskIpAddress(value);
      } else {
        // Generic masking for other sensitive fields
        masked[key] = value.length > 4
          ? value.slice(0, 2) + '***' + value.slice(-2)
          : '****';
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveFields(value, sensitiveFields);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Create a safe log object with masked sensitive data
 */
export function createSafeLogObject(obj: any, additionalSensitiveFields: string[] = []): any {
  return maskSensitiveFields(obj, additionalSensitiveFields);
}
