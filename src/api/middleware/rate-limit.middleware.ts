import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../../config/redis.config';
// AppError import removed as it's not used in this file

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

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again in 15 minutes',
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req: Request) => `auth:${req.ip}`, // Always use IP for auth
});

/**
 * OTP rate limiter
 * 3 OTP requests per 5 minutes per phone number
 */
export const otpRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: 'Too many OTP requests, please try again in 5 minutes',
  keyGenerator: (req: Request) => `otp:${req.body.phoneNumber || req.ip}`,
});

/**
 * Password reset rate limiter
 * 3 attempts per hour per email/phone
 */
export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again in 1 hour',
  keyGenerator: (req: Request) => `reset:${req.body.email || req.body.phoneNumber || req.ip}`,
});

/**
 * AI API rate limiter
 * 50 requests per hour per user
 */
export const aiRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'AI API rate limit exceeded, please try again in 1 hour',
  keyGenerator: (req: Request) => `ai:${req.user?.id || req.ip}`,
});

/**
 * Integration API rate limiter (WhatsApp/Instagram)
 * 200 requests per hour per user
 */
export const integrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: 'Integration API rate limit exceeded, please try again in 1 hour',
  keyGenerator: (req: Request) => `integration:${req.user?.id || req.ip}`,
});

/**
 * File upload rate limiter
 * 10 uploads per hour per user
 */
export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'File upload rate limit exceeded, please try again in 1 hour',
  keyGenerator: (req: Request) => `upload:${req.user?.id || req.ip}`,
});

/**
 * Webhook rate limiter
 * 1000 requests per hour per IP (for external webhooks)
 */
export const webhookRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: 'Webhook rate limit exceeded',
  keyGenerator: (req: Request) => `webhook:${req.ip}`,
});

/**
 * Custom rate limiter factory
 */
export const createCustomRateLimit = (config: RateLimitConfig) => {
  return createRateLimiter(config);
};

/**
 * Rate limit bypass for trusted IPs
 */
export const rateLimitBypass = (trustedIPs: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress;

    // Skip rate limiting for trusted IPs
    if (trustedIPs.includes(clientIP || '')) {
      return next();
    }

    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === 'development' &&
      (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP?.includes('localhost'))) {
      return next();
    }

    next();
  };
};

/**
 * Dynamic rate limiter based on user subscription
 */
export const dynamicRateLimit = (
  baseLimits: { windowMs: number; max: number },
  premiumMultiplier: number = 5
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    let maxRequests = baseLimits.max;

    // Increase limits for premium users
    if (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'business') {
      maxRequests *= premiumMultiplier;
    }

    const limiter = createRateLimiter({
      windowMs: baseLimits.windowMs,
      max: maxRequests,
      keyGenerator: (req: Request) => `dynamic:${req.user?.id || req.ip}`,
    });

    limiter(req, res, next);
  };
};