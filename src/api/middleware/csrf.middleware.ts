/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection
 * Requirements: 8.2, 8.4
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from './error.middleware';
import { csrfConfig } from '../../config/security.config';

// Store for CSRF tokens (in production, use Redis)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get session identifier from request
 */
function getSessionId(req: Request): string {
  // Use user ID if authenticated, otherwise use a combination of IP and user agent
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

/**
 * CSRF token generation middleware
 * Generates and sets CSRF token in cookie and response
 */
export const csrfTokenGenerator = (req: Request, res: Response, next: NextFunction): void => {
  if (!csrfConfig.enabled) {
    return next();
  }

  const sessionId = getSessionId(req);
  const existingToken = csrfTokenStore.get(sessionId);

  // Check if existing token is still valid
  if (existingToken && existingToken.expires > Date.now()) {
    // Attach token to request for use in templates/responses
    req.csrfToken = existingToken.token;
  } else {
    // Generate new token
    const newToken = generateCsrfToken();
    const expires = Date.now() + csrfConfig.cookie.maxAge;

    csrfTokenStore.set(sessionId, { token: newToken, expires });
    req.csrfToken = newToken;

    // Set CSRF cookie
    res.cookie(csrfConfig.cookie.name, newToken, {
      httpOnly: csrfConfig.cookie.httpOnly,
      secure: csrfConfig.cookie.secure,
      sameSite: csrfConfig.cookie.sameSite,
      maxAge: csrfConfig.cookie.maxAge,
    });
  }

  next();
};

/**
 * CSRF token validation middleware
 * Validates CSRF token on state-changing requests
 */
export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  if (!csrfConfig.enabled) {
    return next();
  }

  // Skip CSRF for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for excluded routes
  const isExcluded = csrfConfig.excludeRoutes.some(route => req.path.startsWith(route));
  if (isExcluded) {
    return next();
  }

  // Get token from header or body
  const tokenFromHeader = req.get(csrfConfig.headerName);
  const tokenFromBody = req.body?._csrf;
  const submittedToken = tokenFromHeader || tokenFromBody;

  if (!submittedToken) {
    return next(new AppError('CSRF token missing', 403, 'CSRF_TOKEN_MISSING'));
  }

  // Get stored token
  const sessionId = getSessionId(req);
  const storedData = csrfTokenStore.get(sessionId);

  if (!storedData) {
    return next(new AppError('CSRF session not found', 403, 'CSRF_SESSION_NOT_FOUND'));
  }

  // Check token expiry
  if (storedData.expires < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return next(new AppError('CSRF token expired', 403, 'CSRF_TOKEN_EXPIRED'));
  }

  // Validate token using timing-safe comparison
  const isValid = crypto.timingSafeEqual(
    Buffer.from(submittedToken),
    Buffer.from(storedData.token)
  );

  if (!isValid) {
    console.warn('🚫 CSRF token mismatch:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    return next(new AppError('Invalid CSRF token', 403, 'CSRF_TOKEN_INVALID'));
  }

  next();
};

/**
 * CSRF token endpoint handler
 * Returns a new CSRF token for the client
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      csrfToken: req.csrfToken,
    },
  });
};

/**
 * Clean up expired CSRF tokens (call periodically)
 */
export function cleanupExpiredCsrfTokens(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, data] of csrfTokenStore.entries()) {
    if (data.expires < now) {
      csrfTokenStore.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired CSRF tokens`);
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      csrfToken?: string;
    }
  }
}
