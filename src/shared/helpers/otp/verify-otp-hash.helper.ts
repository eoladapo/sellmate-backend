import * as bcrypt from 'bcrypt';

/**
 * Verify an OTP against its hash
 * @param otp - The plain text OTP
 * @param hash - The hashed OTP to compare against
 * @returns Promise<boolean> - True if OTP matches hash
 */
export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}