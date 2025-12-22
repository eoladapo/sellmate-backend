import { OTPVerification } from '../entities/otp-verification.entity';

export interface IOTPRepository {
  findByPhoneNumber(phoneNumber: string): Promise<OTPVerification | null>;
  create(otpData: Partial<OTPVerification>): Promise<OTPVerification>;
  update(id: string, otpData: Partial<OTPVerification>): Promise<OTPVerification>;
  delete(id: string): Promise<boolean>;
  deleteExpired(): Promise<number>;
}
