import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { createSafeLogObject } from '../../shared/helpers/encryption';

/**
 * Custom request logging interface
 */
interface LogData {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  timestamp: string;
}

/**
 * Enhanced request logging middleware
 * Logs detailed request information for debugging and monitoring
 * Automatically masks sensitive data in logs
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;

    const logData: LogData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Add user agent if available
    const userAgent = req.get('User-Agent');
    if (userAgent) {
      logData.userAgent = userAgent;
    }

    // Add user ID if authenticated (from JWT middleware)
    if (req.user?.id) {
      logData.userId = req.user.id;
    }

    // Log based on status code
    if (res.statusCode >= 500) {
      console.error('🔴 Server Error:', logData);
    } else if (res.statusCode >= 400) {
      console.warn('🟡 Client Error:', logData);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('🟢 Request:', logData);
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Morgan configuration for different environments
 */
export const morganLogger = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Combined format with custom tokens
    return morgan('combined', {
      skip: (_req, res) => res.statusCode < 400, // Only log errors in production
    });
  } else if (process.env.NODE_ENV === 'development') {
    // Development: Detailed format
    return morgan('dev');
  } else {
    // Test: No logging
    return morgan('combined', {
      skip: () => true,
    });
  }
};

/**
 * Security-focused request logger
 * Logs potentially suspicious requests with masked sensitive data
 */
export const securityLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i,   // JavaScript protocol
    /vbscript:/i,     // VBScript protocol
  ];

  const url = req.originalUrl.toLowerCase();
  const body = JSON.stringify(req.body).toLowerCase();

  const isSuspicious = suspiciousPatterns.some(pattern =>
    pattern.test(url) || pattern.test(body)
  );

  if (isSuspicious) {
    // Mask sensitive data before logging
    const safeBody = createSafeLogObject(req.body);

    console.warn('🚨 Suspicious Request Detected:', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: safeBody,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
