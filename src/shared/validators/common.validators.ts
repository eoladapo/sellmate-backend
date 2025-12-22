import { z } from 'zod';

/**
 * Common validation schemas used across the application
 */

/**
 * Nigerian phone number validation
 */
export const nigerianPhoneSchema = z
  .string()
  .regex(/^(\+234|234|0)?[789][01]\d{8}$/, 'Invalid Nigerian phone number format')
  .transform((phone) => {
    // Normalize to +234 format
    if (phone.startsWith('0')) {
      return '+234' + phone.slice(1);
    }
    if (phone.startsWith('234')) {
      return '+' + phone;
    }
    if (!phone.startsWith('+234')) {
      return '+234' + phone;
    }
    return phone;
  });

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Pagination query parameters
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid end date'),
});

/**
 * Search query validation
 */
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  filters: z.record(z.string()).optional(),
});

/**
 * Business name validation
 */
export const businessNameSchema = z
  .string()
  .min(2, 'Business name must be at least 2 characters')
  .max(100, 'Business name must not exceed 100 characters')
  .trim();

/**
 * Password validation (for future use)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

/**
 * OTP validation
 */
export const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

/**
 * Currency amount validation (Nigerian Naira)
 */
export const currencySchema = z
  .number()
  .positive('Amount must be positive')
  .max(999999999.99, 'Amount too large')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');

/**
 * Platform validation
 */
export const platformSchema = z.enum(['whatsapp', 'instagram'], {
  errorMap: () => ({ message: 'Platform must be either whatsapp or instagram' }),
});

/**
 * Order status validation
 */
export const orderStatusSchema = z.enum([
  'draft',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
], {
  errorMap: () => ({ message: 'Invalid order status' }),
});

/**
 * Notification type validation
 */
export const notificationTypeSchema = z.enum([
  'order_created',
  'order_confirmed',
  'order_shipped',
  'order_delivered',
  'message_received',
  'low_inventory',
  'profit_alert',
  'system_update',
], {
  errorMap: () => ({ message: 'Invalid notification type' }),
});

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().min(1, 'File type is required'),
  size: z.number().positive('File size must be positive'),
});

/**
 * Webhook signature validation
 */
export const webhookSignatureSchema = z.object({
  signature: z.string().min(1, 'Webhook signature is required'),
  timestamp: z.string().min(1, 'Webhook timestamp is required'),
});

/**
 * API key validation
 */
export const apiKeySchema = z
  .string()
  .min(32, 'API key must be at least 32 characters')
  .max(128, 'API key must not exceed 128 characters');

/**
 * Language code validation
 */
export const languageSchema = z.enum(['en', 'yo', 'ig', 'ha'], {
  errorMap: () => ({ message: 'Language must be one of: en, yo, ig, ha' }),
});

/**
 * Timezone validation
 */
export const timezoneSchema = z
  .string()
  .refine((tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid timezone');

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long');

/**
 * Color hex code validation
 */
export const colorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format');

/**
 * Coordinate validation (for delivery addresses)
 */
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Nigerian state validation
 */
export const nigerianStateSchema = z.enum([
  'abia', 'adamawa', 'akwa-ibom', 'anambra', 'bauchi', 'bayelsa', 'benue',
  'borno', 'cross-river', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu',
  'gombe', 'imo', 'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi',
  'kwara', 'lagos', 'nasarawa', 'niger', 'ogun', 'ondo', 'osun', 'oyo',
  'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara', 'fct',
], {
  errorMap: () => ({ message: 'Invalid Nigerian state' }),
});