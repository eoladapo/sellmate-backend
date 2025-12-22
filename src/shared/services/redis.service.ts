import { createClient, RedisClientType } from 'redis';
import { appConfig } from '../../config/app.config';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({ url: appConfig.redis.url });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result;
  }

  // Token blacklist methods
  async blacklistToken(tokenId: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:${tokenId}`, '1', ttlSeconds);
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    return this.exists(`blacklist:${tokenId}`);
  }

  // Session storage methods
  async storeSession(sessionId: string, sessionData: any, ttlSeconds: number): Promise<void> {
    await this.set(`session:${sessionId}`, JSON.stringify(sessionData), ttlSeconds);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const data = await this.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<number> {
    return this.del(`session:${sessionId}`);
  }
}