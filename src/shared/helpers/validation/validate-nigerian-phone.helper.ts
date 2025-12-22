/**
 * Validate Nigerian phone number format
 * Supports formats: +2348012345678, 2348012345678, 08012345678
 * @param phoneNumber - The phone number to validate
 * @returns boolean - True if valid Nigerian phone number
 */
export function validateNigerianPhone(phoneNumber: string): boolean {
  const NIGERIAN_PHONE_REGEX = /^(\+234|234|0)(70|80|81|90|91|70|71)\d{8}$/;
  return NIGERIAN_PHONE_REGEX.test(phoneNumber);
}