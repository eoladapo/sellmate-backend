import { z } from 'zod';

// Nigerian phone number regex pattern
const NIGERIAN_PHONE_REGEX = /^(\+234|234|0)(70|80|81|90|91|70|71)\d{8}$/;

export const userValidationSchema = {
  register: z.object({
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .regex(NIGERIAN_PHONE_REGEX, 'Invalid Nigerian phone number format'),
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .max(255, 'Business name must not exceed 255 characters')
      .trim(),
    email: z
      .string()
      .email('Invalid email format')
      .optional()
      .or(z.literal('')),
  }),

  updateProfile: z.object({
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .max(255, 'Business name must not exceed 255 characters')
      .trim()
      .optional(),
    email: z
      .string()
      .email('Invalid email format')
      .optional()
      .or(z.literal('')),
    businessProfile: z
      .object({
        name: z.string().min(1, 'Business profile name is required').optional(),
        contactPhone: z
          .string()
          .regex(NIGERIAN_PHONE_REGEX, 'Invalid Nigerian phone number format')
          .optional(),
        defaultLocation: z.string().min(1, 'Default location is required').optional(),
      })
      .optional(),
  }),
};

export class UserValidator {
  static validateRegistration(data: unknown) {
    return userValidationSchema.register.parse(data);
  }

  static validateProfileUpdate(data: unknown) {
    return userValidationSchema.updateProfile.parse(data);
  }

  static validateNigerianPhoneNumber(phoneNumber: string): boolean {
    return NIGERIAN_PHONE_REGEX.test(phoneNumber);
  }

  static formatNigerianPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('234')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+234${cleaned.slice(1)}`;
    } else if (cleaned.length === 10) {
      return `+234${cleaned}`;
    }

    throw new Error('Invalid phone number format');
  }

  static sanitizeBusinessName(businessName: string): string {
    return businessName.trim().replace(/\s+/g, ' ');
  }
}