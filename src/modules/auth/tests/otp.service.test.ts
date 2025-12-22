import { OTPService, ISMSService } from '../services/otp.service';
import { IOTPRepository } from '../interfaces/otp-repository.interface';

describe('OTPService', () => {
  let otpService: OTPService;
  let mockOTPRepository: jest.Mocked<IOTPRepository>;
  let mockSMSService: jest.Mocked<ISMSService>;

  beforeEach(() => {
    mockOTPRepository = {
      findByPhoneNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteExpired: jest.fn(),
    };

    mockSMSService = {
      sendSMS: jest.fn(),
    };

    otpService = new OTPService(mockOTPRepository, mockSMSService);
  });

  describe('sendOTP', () => {
    it('should send OTP successfully for valid phone number', async () => {
      const phoneNumber = '+2348012345678';
      mockOTPRepository.findByPhoneNumber.mockResolvedValue(null);
      mockOTPRepository.create.mockResolvedValue({} as any);
      mockSMSService.sendSMS.mockResolvedValue({ success: true, messageId: 'test-id' });

      const result = await otpService.sendOTP(phoneNumber);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(mockSMSService.sendSMS).toHaveBeenCalled();
    });

    it('should reject invalid phone number format', async () => {
      const phoneNumber = '123456789';

      const result = await otpService.sendOTP(phoneNumber);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid Nigerian phone number format');
      expect(mockSMSService.sendSMS).not.toHaveBeenCalled();
    });

    it('should prevent sending OTP if recent one exists', async () => {
      const phoneNumber = '+2348012345678';
      const futureDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      mockOTPRepository.findByPhoneNumber.mockResolvedValue({
        id: '1',
        phoneNumber,
        otpHash: 'hash',
        expiresAt: futureDate,
        attempts: 0,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await otpService.sendOTP(phoneNumber);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Please wait');
      expect(mockSMSService.sendSMS).not.toHaveBeenCalled();
    });
  });

  describe('verifyOTP', () => {
    it('should return error if no OTP found', async () => {
      mockOTPRepository.findByPhoneNumber.mockResolvedValue(null);

      const result = await otpService.verifyOTP('+2348012345678', '123456');

      expect(result.success).toBe(false);
      expect(result.message).toBe('No OTP found for this phone number');
    });

    it('should return error if OTP is expired', async () => {
      const pastDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      mockOTPRepository.findByPhoneNumber.mockResolvedValue({
        id: '1',
        phoneNumber: '+2348012345678',
        otpHash: 'hash',
        expiresAt: pastDate,
        attempts: 0,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await otpService.verifyOTP('+2348012345678', '123456');

      expect(result.success).toBe(false);
      expect(result.message).toBe('OTP has expired. Please request a new one.');
    });
  });
});