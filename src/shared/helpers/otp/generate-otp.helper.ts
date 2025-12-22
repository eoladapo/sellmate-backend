/**
 * Generate a random 6-digit OTP
 * @returns A 6-digit numeric string
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}