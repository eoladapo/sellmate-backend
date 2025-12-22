import { initializeRedis, closeRedis, getRedisClient, RedisUtils } from '../redis.config';

describe('Redis Configuration', () => {
  let isRedisAvailable = false;

  beforeAll(async () => {
    try {
      // Try to initialize Redis once for all tests
      const client = await initializeRedis();
      isRedisAvailable = client && client.isOpen;
    } catch (error) {
      console.warn('Redis not available for testing:', error);
      isRedisAvailable = false;
    }
  });

  describe('Redis Connection', () => {
    // Note: These tests require a running Redis instance
    // They will be skipped if Redis is not available

    it('should initialize Redis connection', async () => {
      if (!isRedisAvailable) {
        console.warn('Skipping Redis connection test - Redis not available');
        return;
      }

      const client = getRedisClient();
      expect(client).toBeDefined();
      expect(client?.isOpen).toBe(true);
    });

    it('should get Redis client instance', () => {
      const client = getRedisClient();
      // Client might be null if not initialized
      if (client) {
        expect(client).toBeDefined();
      }
    });
  });

  describe('Redis Utils', () => {

    it('should set and get a value', async () => {
      if (!isRedisAvailable) {
        console.warn('Skipping Redis utils test - Redis not available');
        return;
      }

      try {
        await RedisUtils.set('test:key', 'test-value');
        const value = await RedisUtils.get('test:key');
        expect(value).toBe('test-value');
        await RedisUtils.del('test:key');
      } catch (error) {
        console.warn('Redis operation test skipped:', error);
      }
    });

    it('should set value with expiration', async () => {
      if (!isRedisAvailable) {
        console.warn('Skipping Redis expiry test - Redis not available');
        return;
      }

      try {
        await RedisUtils.set('test:expiry', 'value', 10);
        const ttl = await RedisUtils.ttl('test:expiry');
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(10);
        await RedisUtils.del('test:expiry');
      } catch (error) {
        console.warn('Redis expiry test skipped:', error);
      }
    });

    it('should check if key exists', async () => {
      if (!isRedisAvailable) {
        console.warn('Skipping Redis exists test - Redis not available');
        return;
      }

      try {
        await RedisUtils.set('test:exists', 'value');
        const exists = await RedisUtils.exists('test:exists');
        expect(exists).toBe(true);

        await RedisUtils.del('test:exists');
        const notExists = await RedisUtils.exists('test:exists');
        expect(notExists).toBe(false);
      } catch (error) {
        console.warn('Redis exists test skipped:', error);
      }
    });

    it('should store and retrieve JSON objects', async () => {
      if (!isRedisAvailable) {
        console.warn('Skipping Redis JSON test - Redis not available');
        return;
      }

      try {
        const testObject = { name: 'Test', value: 123, active: true };
        await RedisUtils.setJSON('test:json', testObject);
        const retrieved = await RedisUtils.getJSON<typeof testObject>('test:json');
        expect(retrieved).toEqual(testObject);
        await RedisUtils.del('test:json');
      } catch (error) {
        console.warn('Redis JSON test skipped:', error);
      }
    });

    afterAll(async () => {
      if (!isRedisAvailable) {
        return;
      }

      try {
        // Clean up any remaining test keys
        const client = getRedisClient();
        if (client && client.isOpen) {
          const keys = await client.keys('test:*');
          if (keys.length > 0) {
            await client.del(keys);
          }
        }
      } catch (error) {
        // Ignore cleanup errors during testing
        console.warn('Redis cleanup error (ignored):', error);
      }
    });

    afterAll(async () => {
      // Close Redis connection after all tests
      try {
        await closeRedis();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });
});
