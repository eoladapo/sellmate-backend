export interface VerifyOTPDto {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOTPResponseDto {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id: string;
    phoneNumber: string;
    businessName: string;
    isVerified: boolean;
  };
  attemptsRemaining?: number;
  lockedUntil?: Date;
}
