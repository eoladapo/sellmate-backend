import { injectable, inject } from 'tsyringe';
import { IOTPService, SendOTPResult, VerifyOTPResult } from '../interfaces/otp-service.interface';
import { IOTPRepository } from '../interfaces/otp-repository.interface';
import { generateOTP, hashOTP, verifyOTPHash } from '../../../shared/helpers/otp';
import { validateNigerianPhone } from '../../../shared/helpers/validation';
import { appConfig } from '../../../config/app.config';
import { TOKENS } from '../../../di/tokens';

// SMS Service interface (to be implemented with Twilio or Termii)
export interface ISMSService {
  sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

@injectable()
export class OTPService implements IOTPService {
  private readonly OTP_EXPIRY_MINUTES = appConfig.otp.expiryMinutes;
  private readonly MAX_ATTEMPTS = appConfig.otp.maxAttempts;
  private readonly LOCKOUT_MINUTES = appConfig.otp.lockoutMinutes;
  private readonly PROGRESSIVE_DELAYS = appConfig.otp.progressiveDelays;

  constructor(
    @inject(TOKENS.OTPRepository) private otpRepository: IOTPRepository,
    @inject(TOKENS.SMSService) private smsService: ISMSService
  ) {}

  async sendOTP(phoneNumber: string): Promise<SendOTPResult> {
    // Validate phone number format
    if (!validateNigerianPhone(phoneNumber)) {
      return {
        success: false,
        message: 'Invalid Nigerian phone number format',
        expiresAt: new Date(),
      };
    }

    try {
      // Check for existing OTP
      const existingOTP = await this.otpRepository.findByPhoneNumber(phoneNumber);

      // If there's a recent OTP that's not expired, don't send a new one
      if (existingOTP && existingOTP.expiresAt > new Date()) {
        const timeRemaining = Math.ceil((existingOTP.expiresAt.getTime() - Date.now()) / 60000);
        return {
          success: false,
          message: `Please wait ${timeRemaining} minutes before requesting a new OTP`,
          expiresAt: existingOTP.expiresAt,
        };
      }

      // Generate new OTP
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Save OTP to database
      await this.otpRepository.create({
        phoneNumber,
        otpHash,
        expiresAt,
        attempts: 0,
        verified: false,
      });

      // Send OTP via SMS
      const smsResult = await this.smsService.sendSMS(
        phoneNumber,
        `Your SellMate verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
      );

      if (!smsResult.success) {
        // In development mode, still return success with OTP for testing
        if (appConfig.isDevelopment) {
          console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
          return {
            success: true,
            message: 'OTP generated (dev mode - SMS not sent)',
            expiresAt,
            devOtp: otp, // Only in development!
          };
        }
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.',
          expiresAt,
        };
      }

      // In development mode, also return OTP in response for easy testing
      if (appConfig.isDevelopment) {
        return {
          success: true,
          message: 'OTP sent successfully (dev mode)',
          expiresAt,
          devOtp: otp, // Only in development!
        };
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
        expiresAt: new Date(),
      };
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<VerifyOTPResult> {
    try {
      const otpRecord = await this.otpRepository.findByPhoneNumber(phoneNumber);

      if (!otpRecord) {
        return {
          success: false,
          message: 'No OTP found for this phone number',
        };
      }

      // Check if OTP is expired
      if (otpRecord.expiresAt < new Date()) {
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.',
        };
      }

      // Check if already verified
      if (otpRecord.verified) {
        return {
          success: false,
          message: 'OTP has already been used',
        };
      }

      // Check attempt limits and progressive delays
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        const lockedUntil = new Date(
          otpRecord.createdAt.getTime() + this.LOCKOUT_MINUTES * 60 * 1000
        );
        if (new Date() < lockedUntil) {
          return {
            success: false,
            message: 'Too many failed attempts. Please try again later.',
            lockedUntil,
          };
        }
      } else if (otpRecord.attempts > 0) {
        // Apply progressive delay based on attempt count
        const delaySeconds =
          this.PROGRESSIVE_DELAYS[Math.min(otpRecord.attempts, this.PROGRESSIVE_DELAYS.length - 1)];
        const nextAttemptTime = new Date(otpRecord.updatedAt.getTime() + delaySeconds * 1000);

        if (new Date() < nextAttemptTime) {
          const waitTime = Math.ceil((nextAttemptTime.getTime() - Date.now()) / 1000);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before trying again.`,
            lockedUntil: nextAttemptTime,
          };
        }
      }

      // Increment attempts
      await this.otpRepository.update(otpRecord.id, {
        attempts: otpRecord.attempts + 1,
      });

      // Verify OTP
      const isValid = await verifyOTPHash(otp, otpRecord.otpHash);

      if (!isValid) {
        const attemptsRemaining = this.MAX_ATTEMPTS - (otpRecord.attempts + 1);
        return {
          success: false,
          message: 'Invalid OTP',
          attemptsRemaining: Math.max(0, attemptsRemaining),
        };
      }

      // Mark as verified
      await this.otpRepository.update(otpRecord.id, {
        verified: true,
      });

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  async cleanupExpiredOTPs(): Promise<number> {
    return this.otpRepository.deleteExpired();
  }
}
