import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { AppError } from './error.middleware';
import { cspConfig, tlsConfig, securityHeadersConfig } from '../../config/security.config';

/**
 * Build CSP directives with optional upgrade-insecure-requests
 */
const buildCspDirectives = () => {
  const directives: Record<string, string[]> = { ...cspConfig.directives };

  if (cspConfig.upgradeInsecureRequests) {
    directives.upgradeInsecureRequests = [];
  }

  return directives;
};

/**
 * Security headers middleware using Helmet
 * Requirements: 8.2, 8.4
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: buildCspDirectives(),
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: tlsConfig.hsts.maxAge,
    includeSubDomains: tlsConfig.hsts.includeSubDomains,
    preload: tlsConfig.hsts.preload,
  },

  // X-Frame-Options
  frameguard: {
    action: securityHeadersConfig.frameOptions.toLowerCase() as 'deny' | 'sameorigin',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: securityHeadersConfig.referrerPolicy as any,
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Disable for API
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
});

/**
 * API Key validation middleware
 */
export const validateApiKey = (req: Request, _res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.API_KEYS?.split(',') || [];

  // Skip API key validation for certain routes
  const skipRoutes = ['/health', '/api/v1/auth', '/api/v1/webhooks'];
  const shouldSkip = skipRoutes.some(route => req.path.startsWith(route));

  if (shouldSkip) {
    return next();
  }

  if (!apiKey) {
    return next(new AppError('API key is required', 401, 'API_KEY_REQUIRED'));
  }

  if (!validApiKeys.includes(apiKey)) {
    return next(new AppError('Invalid API key', 401, 'INVALID_API_KEY'));
  }

  next();
};

/**
 * Request origin validation
 */
export const validateOrigin = (allowedOrigins: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const origin = req.get('Origin') || req.get('Referer');

    // Skip validation if no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return next();
    }

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return next();
    }

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));

    if (!isAllowed) {
      console.warn(`🚫 Blocked request from unauthorized origin: ${origin}`);
      return next(new AppError('Unauthorized origin', 403, 'UNAUTHORIZED_ORIGIN'));
    }

    next();
  };
};

/**
 * Request size limiter
 */
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > maxSize) {
      return next(new AppError(
        `Request too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        413,
        'REQUEST_TOO_LARGE'
      ));
    }

    next();
  };
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || '';

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      if (localhostIPs.includes(clientIP)) {
        return next();
      }
    }

    if (allowedIPs.length === 0) {
      return next(); // No restrictions if no IPs specified
    }

    if (!allowedIPs.includes(clientIP)) {
      console.warn(`🚫 Blocked request from unauthorized IP: ${clientIP}`);
      return next(new AppError('Unauthorized IP address', 403, 'UNAUTHORIZED_IP'));
    }

    next();
  };
};

/**
 * User agent validation
 */
export const validateUserAgent = (req: Request, _res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent');

  // Block requests without user agent (potential bots)
  if (!userAgent) {
    console.warn('🚫 Blocked request without User-Agent header');
    return next(new AppError('User-Agent header is required', 400, 'USER_AGENT_REQUIRED'));
  }

  // Block known malicious user agents
  const maliciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /nmap/i,
    /wget/i,
    /curl/i, // Be careful with this one, might block legitimate requests
  ];

  const isMalicious = maliciousPatterns.some(pattern => pattern.test(userAgent));

  if (isMalicious) {
    console.warn(`🚫 Blocked request from suspicious User-Agent: ${userAgent}`);
    return next(new AppError('Suspicious user agent detected', 403, 'SUSPICIOUS_USER_AGENT'));
  }

  next();
};

/**
 * Request method validation
 */
export const validateMethod = (allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!allowedMethods.includes(req.method)) {
      return next(new AppError(`Method ${req.method} not allowed`, 405, 'METHOD_NOT_ALLOWED'));
    }
    next();
  };
};

/**
 * Content type validation
 */
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Skip validation for GET requests and requests without body
    if (req.method === 'GET' || !req.body || Object.keys(req.body).length === 0) {
      return next();
    }

    const contentType = req.get('Content-Type') || '';
    const isAllowed = allowedTypes.some(type => contentType.includes(type));

    if (!isAllowed) {
      return next(new AppError(
        `Content-Type must be one of: ${allowedTypes.join(', ')}`,
        415,
        'UNSUPPORTED_MEDIA_TYPE'
      ));
    }

    next();
  };
};

/**
 * Honeypot middleware to catch bots
 */
export const honeypot = (req: Request, _res: Response, next: NextFunction): void => {
  // Check for honeypot field in request body
  if (req.body && req.body.honeypot) {
    console.warn(`🍯 Honeypot triggered by IP: ${req.ip}`);
    return next(new AppError('Bot detected', 403, 'BOT_DETECTED'));
  }

  next();
};

/**
 * Security audit logger
 */
export const securityAuditLog = (req: Request, _res: Response, next: NextFunction): void => {
  // Log security-relevant events
  const securityEvents = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    userId: req.user?.id,
  };

  // Log failed authentication attempts
  if (req.path.includes('/auth') && req.method === 'POST') {
    console.log('🔐 Auth attempt:', securityEvents);
  }

  // Log admin access attempts
  if (req.path.includes('/admin')) {
    console.log('👑 Admin access:', securityEvents);
  }

  next();
};