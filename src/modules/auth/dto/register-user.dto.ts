export interface RegisterUserDto {
  phoneNumber: string;
  businessName: string;
  email?: string;
}

export interface RegisterUserResponseDto {
  userId: string;
  phoneNumber: string;
  otpSent: boolean;
  message: string;
}