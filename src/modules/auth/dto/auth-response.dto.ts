export interface AuthResponseDto {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id: string;
    phoneNumber: string;
    businessName: string;
    email?: string;
    isVerified: boolean;
    onboardingCompleted: boolean;
  };
}
