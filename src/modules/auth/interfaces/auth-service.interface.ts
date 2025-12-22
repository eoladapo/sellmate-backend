import { User } from '../entities/user.entity';
import { AuthTokens } from './jwt-service.interface';
import { DeviceInfo } from './device-info.interface';

export interface RegisterResult {
  success: boolean;
  user?: User;
  message: string;
  otpSent?: boolean;
  devOtp?: string; // Only returned in development mode for testing
}

export interface LoginResult {
  success: boolean;
  tokens?: AuthTokens;
  user?: User;
  message: string;
  attemptsRemaining?: number;
  lockedUntil?: Date;
}

export interface SendOTPResult {
  success: boolean;
  message: string;
  devOtp?: string; // Only returned in development mode for testing
}

export interface IAuthService {
  register(phoneNumber: string, businessName: string, email?: string): Promise<RegisterResult>;
  sendLoginOTP(phoneNumber: string): Promise<SendOTPResult>;
  verifyOTPAndLogin(phoneNumber: string, otp: string, deviceInfo: DeviceInfo): Promise<LoginResult>;
  refreshToken(refreshToken: string): Promise<{ success: boolean; tokens?: AuthTokens; error?: string }>;
  logout(refreshToken: string): Promise<boolean>;
  logoutAllDevices(userId: string): Promise<number>;
}