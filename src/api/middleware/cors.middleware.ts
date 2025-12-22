import { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import { corsConfig } from '../../config/security.config';

/**
 * CORS configuration for different environments
 * Requirements: 8.2, 8.4
 */
const getCorsOptions = (): CorsOptions => {
  const allowedOrigins = corsConfig.allowedOrigins;

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In development, allow all localhost origins
      if (process.env.NODE_ENV === 'development') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log blocked origin for debugging
      console.warn(`🚫 CORS: Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Client-Version',
      'X-CSRF-Token',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
    ],
    maxAge: 86400, // 24 hours - how long browser can cache preflight response
  };
};

/**
 * CORS middleware with environment-specific configuration
 */
export const corsMiddleware = cors(getCorsOptions());

/**
 * Custom CORS handler for specific routes that need different settings
 */
export const customCors = (origins: string[] = []) => {
  const customOptions: CorsOptions = {
    ...getCorsOptions(),
    origin: origins.length > 0 ? origins : getCorsOptions().origin,
  };

  return cors(customOptions);
};

/**
 * Strict CORS for sensitive endpoints (admin, billing, etc.)
 * Uses admin origins whitelist from security config
 */
export const strictCors = cors({
  origin: corsConfig.adminOrigins.length > 0
    ? corsConfig.adminOrigins
    : false, // No origins allowed by default
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});

/**
 * Public CORS for webhooks and public APIs
 * Uses webhook origins whitelist from security config
 */
export const publicCors = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server)
    if (!origin) return callback(null, true);

    // Check webhook origins whitelist
    if (corsConfig.webhookOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all origins for public endpoints in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: false,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Webhook-Signature', 'X-Hub-Signature-256'],
});

/**
 * Preflight handler for complex CORS requests
 */
export const preflightHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).end();
  } else {
    next();
  }
};