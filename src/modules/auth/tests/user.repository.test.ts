import { DataSource } from 'typeorm';
import { UserRepository } from '../repositories/user.repository';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as any;

    userRepository = new UserRepository(mockDataSource);
  });

  describe('findByPhoneNumber', () => {
    it('should find user by phone number', async () => {
      const phoneNumber = '+2348012345678';
      const mockUser = { id: '1', phoneNumber, businessName: 'Test Business' };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.findByPhoneNumber(phoneNumber);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { phoneNumber } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userRepository.findByPhoneNumber('+2348012345678');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        phoneNumber: '+2348012345678',
        businessName: 'Test Business',
        isVerified: false,
      };
      const mockUser = { id: '1', ...userData };

      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await userRepository.create(userData);

      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('exists', () => {
    it('should return true if user exists', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await userRepository.exists('+2348012345678');

      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await userRepository.exists('+2348012345678');

      expect(result).toBe(false);
    });
  });
});