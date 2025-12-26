import { injectable, inject } from 'tsyringe';
import {
  IAuthService,
  RegisterResult,
  LoginResult,
  SendOTPResult,
} from '../interfaces/auth-service.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IOTPService } from '../interfaces/otp-service.interface';
import { IJWTService, AuthTokens } from '../interfaces/jwt-service.interface';
import { UserValidator } from '../validators/user.validator';
import { DeviceInfo } from '../interfaces/device-info.interface';
import { RegistrationMethod } from '../enums/registration-method.enum';
import { TOKENS } from '../../../di/tokens';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository,
    @inject(TOKENS.OTPService) private otpService: IOTPService,
    @inject(TOKENS.JWTService) private jwtService: IJWTService
  ) { }

  async register(
    phoneNumber: string,
    businessName: string,
    email?: string
  ): Promise<RegisterResult> {
    try {
      // Validate input
      const validatedData = UserValidator.validateRegistration({
        phoneNumber,
        businessName,
        email,
      });

      // Format phone number
      const formattedPhone = UserValidator.formatNigerianPhoneNumber(validatedData.phoneNumber);

      // Check if user already exists
      const existingUser = await this.userRepository.findByPhoneNumber(formattedPhone);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this phone number already exists',
        };
      }

      // Create user
      const user = await this.userRepository.create({
        phoneNumber: formattedPhone,
        businessName: UserValidator.sanitizeBusinessName(validatedData.businessName),
        email: validatedData.email || undefined,
        isVerified: false,
        registrationMethod: RegistrationMethod.PHONE,
        businessProfile: {
          name: validatedData.businessName,
          contactPhone: formattedPhone,
          defaultLocation: '',
        },
        connectedPlatforms: {
          whatsapp: { connected: false },
          instagram: { connected: false },
        },
        onboardingCompleted: false,
      });

      // Send OTP
      const otpResult = await this.otpService.sendOTP(formattedPhone);

      return {
        success: true,
        user,
        message: otpResult.success
          ? 'User registered successfully. OTP sent.'
          : 'User registered but failed to send OTP.',
        otpSent: otpResult.success,
        devOtp: otpResult.devOtp, // Only in development mode
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async sendLoginOTP(phoneNumber: string): Promise<SendOTPResult> {
    try {
      // Format phone number
      const formattedPhone = UserValidator.formatNigerianPhoneNumber(phoneNumber);

      // Check if user exists
      const user = await this.userRepository.findByPhoneNumber(formattedPhone);
      if (!user) {
        return {
          success: false,
          message: 'User not found. Please register first.',
        };
      }

      // Send OTP
      const otpResult = await this.otpService.sendOTP(formattedPhone);

      return {
        success: otpResult.success,
        message: otpResult.success ? 'OTP sent successfully' : otpResult.message,
        devOtp: otpResult.devOtp,
      };
    } catch (error) {
      console.error('Send login OTP error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  async verifyOTPAndLogin(
    phoneNumber: string,
    otp: string,
    deviceInfo: DeviceInfo
  ): Promise<LoginResult> {
    try {
      // Format phone number
      const formattedPhone = UserValidator.formatNigerianPhoneNumber(phoneNumber);

      // Verify OTP
      const otpResult = await this.otpService.verifyOTP(formattedPhone, otp);

      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
          attemptsRemaining: otpResult.attemptsRemaining,
          lockedUntil: otpResult.lockedUntil,
        };
      }

      // Find user
      const user = await this.userRepository.findByPhoneNumber(formattedPhone);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Mark user as verified if not already
      if (!user.isVerified) {
        await this.userRepository.update(user.id, { isVerified: true });
        user.isVerified = true;
      }

      // Generate tokens
      const tokens = await this.jwtService.generateTokens(user.id, user.phoneNumber, deviceInfo);

      return {
        success: true,
        tokens,
        user,
        message: 'Login successful',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ success: boolean; tokens?: AuthTokens; error?: string }> {
    return this.jwtService.refreshTokens(refreshToken);
  }

  async logout(refreshToken: string): Promise<boolean> {
    return this.jwtService.revokeToken(refreshToken);
  }


}
