import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Client Configuration
 * Handles caching and session storage
 */
let redisClient: RedisClientType | null = null;

/**
 * Redis connection options
 */
const redisOptions = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error('❌ Redis: Too many reconnection attempts, giving up');
        return new Error('Too many reconnection attempts');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
      const delay = Math.min(retries * 50, 3000);
      console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0', 10),
};

/**
 * Initialize Redis connection
 * @returns Promise<RedisClientType>
 */
export const initializeRedis = async (): Promise<RedisClientType> => {
  try {
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }

    redisClient = createClient(redisOptions);

    // Error handling
    redisClient.on('error', (error) => {
      // Only log errors that aren't expected during shutdown or testing
      if (error.message &&
        !error.message.includes('Socket closed unexpectedly') &&
        process.env.NODE_ENV !== 'test') {
        console.error('❌ Redis Client Error:', error);
      }
    });

    // Connection events
    redisClient.on('connect', () => {
      console.log('🔄 Redis: Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connection established successfully');
      console.log(`📦 Connected to: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnecting...');
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis: Connection closed');
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('❌ Error initializing Redis connection:', error);
    throw error;
  }
};

/**
 * Get Redis client instance
 * @returns RedisClientType | null
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Close Redis connection
 * @returns Promise<void>
 */
export const closeRedis = async (): Promise<void> => {
  try {
    if (redisClient && redisClient.isOpen) {
      // Remove all listeners to prevent unhandled error events
      redisClient.removeAllListeners();

      await redisClient.disconnect();
      redisClient = null;

      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Redis connection closed successfully');
      }
    }
  } catch (error) {
    // Ignore connection errors during shutdown, especially in tests
    if (error instanceof Error &&
      !error.message.includes('Socket closed unexpectedly') &&
      process.env.NODE_ENV !== 'test') {
      console.error('❌ Error closing Redis connection:', error);
    }
    redisClient = null;
  }
};

/**
 * Redis utility functions for common operations
 */
export const RedisUtils = {
  /**
   * Set a key-value pair with optional expiration
   */
  set: async (key: string, value: string, expirySeconds?: number): Promise<void> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');

    if (expirySeconds) {
      await client.set(key, value, { EX: expirySeconds });
    } else {
      await client.set(key, value);
    }
  },

  /**
   * Get a value by key
   */
  get: async (key: string): Promise<string | null> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');
    return await client.get(key);
  },

  /**
   * Delete a key
   */
  del: async (key: string): Promise<void> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');
    await client.del(key);
  },

  /**
   * Check if a key exists
   */
  exists: async (key: string): Promise<boolean> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');
    const result = await client.exists(key);
    return result === 1;
  },

  /**
   * Set expiration on a key
   */
  expire: async (key: string, seconds: number): Promise<void> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');
    await client.expire(key, seconds);
  },

  /**
   * Get time to live for a key
   */
  ttl: async (key: string): Promise<number> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');
    return await client.ttl(key);
  },

  /**
   * Store JSON object
   */
  setJSON: async (key: string, value: any, expirySeconds?: number): Promise<void> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');
    const jsonString = JSON.stringify(value);

    if (expirySeconds) {
      await client.set(key, jsonString, { EX: expirySeconds });
    } else {
      await client.set(key, jsonString);
    }
  },

  /**
   * Get JSON object
   */
  getJSON: async <T>(key: string): Promise<T | null> => {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client not initialized');
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },
};
