/**
 * Security Monitoring Middleware
 * Integrates security event logging with request handling
 * Requirements: 8.5
 */

import { Request, Response, NextFunction } from 'express';
import {
  logSecurityEvent,
  trackFailedLogin,
  isLoginLocked,
  createAuditTrailEntry,
} from '../../modules/security/services/security-event.service';
import {
  SecurityEventType,
} from '../../modules/security/interfaces/security-event.interface';
import { AppError } from './error.middleware';

/**
 * Security monitoring middleware
 * Logs security-relevant events for all requests
 */
export const securityMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end to capture response
  res.end = function (chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;

    // Log security events based on response status
    if (res.statusCode === 401) {
      logSecurityEvent(SecurityEventType.ACCESS_DENIED, {
        userId: req.user?.id,
        sessionId: req.headers['x-session-id'] as string,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'] as string,
        resource: req.path,
        action: req.method,
        outcome: 'failure',
        details: {
          statusCode: res.statusCode,
          responseTime,
        },
      });
    }

    if (res.statusCode === 403) {
      logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
        userId: req.user?.id,
        sessionId: req.headers['x-session-id'] as string,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'] as string,
        resource: req.path,
        action: req.method,
        outcome: 'failure',
        details: {
          statusCode: res.statusCode,
          responseTime,
        },
      });
    }

    if (res.statusCode === 429) {
      logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
        userId: req.user?.id,
        sessionId: req.headers['x-session-id'] as string,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'] as string,
        resource: req.path,
        action: req.method,
        outcome: 'failure',
        details: {
          statusCode: res.statusCode,
          responseTime,
        },
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Login attempt monitoring middleware
 * Tracks failed login attempts and enforces lockouts
 */
export const loginAttemptMonitoring = (req: Request, _res: Response, next: NextFunction): void => {
  const ipAddress = req.ip || 'unknown';
  const phoneNumber = req.body?.phoneNumber;

  // Check if login is locked
  if (isLoginLocked(ipAddress, phoneNumber)) {
    logSecurityEvent(SecurityEventType.ACCESS_DENIED, {
      ipAddress,
      outcome: 'failure',
      details: {
        reason: 'Account locked due to too many failed attempts',
        phoneNumber: phoneNumber ? maskPhoneNumber(phoneNumber) : undefined,
      },
    });

    return next(new AppError(
      'Too many failed login attempts. Please try again later.',
      429,
      'ACCOUNT_LOCKED'
    ));
  }

  next();
};

/**
 * Track successful login
 */
export function logSuccessfulLogin(
  userId: string,
  ipAddress: string,
  userAgent?: string,
  sessionId?: string
): void {
  logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
    userId,
    sessionId,
    ipAddress,
    userAgent,
    outcome: 'success',
  });
}

/**
 * Track failed login
 */
export function logFailedLogin(
  ipAddress: string,
  phoneNumber?: string,
  reason: string = 'Invalid credentials'
): void {
  trackFailedLogin(ipAddress, phoneNumber, reason);
}

/**
 * Track logout
 */
export function logLogout(
  userId: string,
  ipAddress: string,
  sessionId?: string
): void {
  logSecurityEvent(SecurityEventType.LOGOUT, {
    userId,
    sessionId,
    ipAddress,
    outcome: 'success',
  });
}

/**
 * Track token refresh
 */
export function logTokenRefresh(
  userId: string,
  ipAddress: string,
  sessionId?: string
): void {
  logSecurityEvent(SecurityEventType.TOKEN_REFRESH, {
    userId,
    sessionId,
    ipAddress,
    outcome: 'success',
  });
}

/**
 * Track OTP events
 */
export function logOtpSent(phoneNumber: string, ipAddress: string): void {
  logSecurityEvent(SecurityEventType.OTP_SENT, {
    ipAddress,
    outcome: 'success',
    details: {
      phoneNumber: maskPhoneNumber(phoneNumber),
    },
  });
}

export function logOtpVerified(userId: string, ipAddress: string): void {
  logSecurityEvent(SecurityEventType.OTP_VERIFIED, {
    userId,
    ipAddress,
    outcome: 'success',
  });
}

export function logOtpFailed(phoneNumber: string, ipAddress: string, reason: string): void {
  logSecurityEvent(SecurityEventType.OTP_FAILED, {
    ipAddress,
    outcome: 'failure',
    details: {
      phoneNumber: maskPhoneNumber(phoneNumber),
      reason,
    },
  });
}

/**
 * Audit trail middleware for sensitive operations
 */
export const auditTrailMiddleware = (resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only audit state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const originalEnd = res.end;

      res.end = function (chunk?: any, encoding?: any): Response {
        // Only log successful operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          createAuditTrailEntry({
            userId: req.user?.id || 'anonymous',
            action: req.method,
            resource,
            resourceId: req.params.id,
            previousValue: undefined, // Would need to be captured before operation
            newValue: req.body,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent'),
            requestId: req.headers['x-request-id'] as string,
          });
        }

        return originalEnd.call(this, chunk, encoding);
      };
    }

    next();
  };
};

/**
 * Suspicious pattern detection middleware
 */
export const suspiciousPatternDetection = (req: Request, _res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /\.\.\//,                    // Path traversal
    /<script/i,                  // XSS attempts
    /union\s+select/i,           // SQL injection
    /javascript:/i,              // JavaScript protocol
    /on\w+\s*=/i,               // Event handlers
    /eval\s*\(/i,               // Eval attempts
    /document\./i,              // DOM manipulation
    /window\./i,                // Window object access
  ];

  const checkString = (str: string): string | null => {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(str)) {
        return pattern.source;
      }
    }
    return null;
  };

  // Check URL
  const urlMatch = checkString(req.originalUrl);
  if (urlMatch) {
    logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'] as string,
      resource: req.path,
      action: req.method,
      outcome: 'failure',
      details: {
        type: 'URL_INJECTION',
        pattern: urlMatch,
        url: req.originalUrl,
      },
    });
  }

  // Check body
  if (req.body) {
    const bodyString = JSON.stringify(req.body);
    const bodyMatch = checkString(bodyString);
    if (bodyMatch) {
      logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'] as string,
        resource: req.path,
        action: req.method,
        outcome: 'failure',
        details: {
          type: 'BODY_INJECTION',
          pattern: bodyMatch,
        },
      });
    }
  }

  next();
};

/**
 * Mask phone number for logging
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return '****';
  return phone.slice(0, 4) + '****' + phone.slice(-2);
}
