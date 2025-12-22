export interface SendOTPResult {
  success: boolean;
  message: string;
  expiresAt: Date;
  devOtp?: string; // Only returned in development mode for testing
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  lockedUntil?: Date;
}

export interface IOTPService {
  sendOTP(phoneNumber: string): Promise<SendOTPResult>;
  verifyOTP(phoneNumber: string, otp: string): Promise<VerifyOTPResult>;
  cleanupExpiredOTPs(): Promise<number>;
}
