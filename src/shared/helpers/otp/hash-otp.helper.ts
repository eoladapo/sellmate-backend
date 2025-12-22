import * as bcrypt from 'bcrypt';

/**
 * Hash an OTP using bcrypt
 * @param otp - The OTP to hash
 * @returns Promise<string> - The hashed OTP
 */
export async function hashOTP(otp: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(otp, saltRounds);
}