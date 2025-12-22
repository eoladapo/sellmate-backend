/**
 * Security Event Interfaces
 * Defines types for security monitoring and audit logging
 * Requirements: 8.5
 */

/**
 * Security event types
 */
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  OTP_SENT = 'OTP_SENT',
  OTP_VERIFIED = 'OTP_VERIFIED',
  OTP_FAILED = 'OTP_FAILED',

  // Authorization events
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Account events
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // Data access events
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETE = 'DATA_DELETE',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',

  // Security threats
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Integration events
  OAUTH_CONNECTED = 'OAUTH_CONNECTED',
  OAUTH_DISCONNECTED = 'OAUTH_DISCONNECTED',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // System events
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  ADMIN_ACTION = 'ADMIN_ACTION',
}

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Security event interface
 */
export interface ISecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  requestId?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Failed login tracking interface
 */
export interface IFailedLoginAttempt {
  ipAddress: string;
  phoneNumber?: string;
  timestamp: Date;
  reason: string;
  attemptCount: number;
  isLocked: boolean;
  lockExpiresAt?: Date;
}

/**
 * Audit trail entry interface
 */
export interface IAuditTrailEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Intrusion detection alert interface
 */
export interface IIntrusionAlert {
  id: string;
  type: string;
  severity: SecurityEventSeverity;
  timestamp: Date;
  ipAddress: string;
  description: string;
  indicators: string[];
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * Security metrics interface
 */
export interface ISecurityMetrics {
  period: {
    start: Date;
    end: Date;
  };
  loginAttempts: {
    total: number;
    successful: number;
    failed: number;
  };
  blockedRequests: {
    total: number;
    byReason: Record<string, number>;
  };
  suspiciousActivities: number;
  intrusionAlerts: number;
  activeUsers: number;
  activeSessions: number;
}
