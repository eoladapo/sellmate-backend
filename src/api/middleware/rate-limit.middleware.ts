import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../../config/redis.config';

/**
 * Rate limit configuration interface
 */
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create Redis-based rate limiter
 */
const createRateLimiter = (config: RateLimitConfig) => {
  const redisClient = getRedisClient();

  if (!redisClient) {
    console.warn('⚠️ Redis not available, using memory-based rate limiting');
  }

  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      message: config.message || 'Too many requests, please try again later',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.windowMs / 1000),
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    skipFailedRequests: config.skipFailedRequests || false,
    keyGenerator: config.keyGenerator || ((req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip || 'anonymous';
    }),
    store: redisClient ? new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }) : undefined,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: config.message || 'Too many requests, please try again later',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(config.windowMs / 1000),
      });
    },
  });
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per user/IP
 */
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests, please try again in 15 minutes',
});








