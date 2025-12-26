import cors, { CorsOptions } from 'cors';
import { corsConfig } from '../../config/security.config';


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


