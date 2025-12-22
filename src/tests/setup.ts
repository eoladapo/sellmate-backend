/**
 * Jest test setup file
 * Runs before all tests to configure the test environment
 */

// Import reflect-metadata for tsyringe DI decorators
import 'reflect-metadata';

// Set test environment variables BEFORE importing any modules
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret_key_32_chars';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_32_chars';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars__';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';

// Mock Redis Service to prevent connection issues in tests
jest.mock('../shared/services/redis.service', () => {
  return {
    RedisService: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(false),
      expire: jest.fn().mockResolvedValue(true),
      blacklistToken: jest.fn().mockResolvedValue(undefined),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
      storeSession: jest.fn().mockResolvedValue(undefined),
      getSession: jest.fn().mockResolvedValue(null),
      deleteSession: jest.fn().mockResolvedValue(1),
    })),
  };
});

// Mock SMS Service to prevent actual SMS sending in tests
jest.mock('../modules/auth/services/sms.service', () => {
  return {
    TwilioSMSService: jest.fn().mockImplementation(() => ({
      sendSMS: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'mock_message_id',
      }),
    })),
    MockSMSService: jest.fn().mockImplementation(() => ({
      sendSMS: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'mock_message_id',
      }),
    })),
  };
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Global test timeout
jest.setTimeout(10000);

// Handle unhandled errors during tests (especially Redis cleanup)
process.on('unhandledRejection', (reason, promise) => {
  if (reason instanceof Error && reason.message.includes('Socket closed unexpectedly')) {
    // Ignore Redis socket cleanup errors during tests
    return;
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('Socket closed unexpectedly')) {
    // Ignore Redis socket cleanup errors during tests
    return;
  }
  console.error('Uncaught Exception:', error);
});
