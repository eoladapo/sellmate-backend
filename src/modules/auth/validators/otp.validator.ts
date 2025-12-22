import { z } from 'zod';

const NIGERIAN_PHONE_REGEX = /^(\+234|234|0)(70|80|81|90|91|70|71)\d{8}$/;

export const otpValidationSchema = {
  sendOTP: z.object({
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .regex(NIGERIAN_PHONE_REGEX, 'Invalid Nigerian phone number format'),
  }),

  verifyOTP: z.object({
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .regex(NIGERIAN_PHONE_REGEX, 'Invalid Nigerian phone number format'),
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
  }),
};

export class OTPValidator {
  static validateSendOTP(data: unknown) {
    return otpValidationSchema.sendOTP.parse(data);
  }

  static validateVerifyOTP(data: unknown) {
    return otpValidationSchema.verifyOTP.parse(data);
  }
}