/**
 * Security Event Service
 * Handles security event logging and monitoring
 * Requirements: 8.5
 */

import crypto from 'crypto';
import {
  ISecurityEvent,
  IFailedLoginAttempt,
  IAuditTrailEntry,
  IIntrusionAlert,
  ISecurityMetrics,
  SecurityEventType,
  SecurityEventSeverity,
} from '../interfaces/security-event.interface';

// In-memory stores (in production, use Redis or database)
const securityEvents: ISecurityEvent[] = [];
const failedLoginAttempts = new Map<string, IFailedLoginAttempt>();
const auditTrail: IAuditTrailEntry[] = [];
const intrusionAlerts: IIntrusionAlert[] = [];

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_EVENTS_IN_MEMORY = 10000;
const LOG_RETENTION_DAYS = 90;

/**
 * Generate unique ID for events
 */
function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Get severity for event type
 */
function getSeverityForEventType(type: SecurityEventType): SecurityEventSeverity {
  const criticalEvents = [
    SecurityEventType.BRUTE_FORCE_DETECTED,
    SecurityEventType.SQL_INJECTION_ATTEMPT,
    SecurityEventType.XSS_ATTEMPT,
    SecurityEventType.ACCOUNT_DELETED,
  ];

  const errorEvents = [
    SecurityEventType.LOGIN_FAILURE,
    SecurityEventType.ACCESS_DENIED,
    SecurityEventType.PERMISSION_DENIED,
    SecurityEventType.CSRF_VIOLATION,
    SecurityEventType.INVALID_TOKEN,
  ];

  const warningEvents = [
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityEventType.SUSPICIOUS_ACTIVITY,
    SecurityEventType.ACCOUNT_LOCKED,
    SecurityEventType.OTP_FAILED,
  ];

  if (criticalEvents.includes(type)) return SecurityEventSeverity.CRITICAL;
  if (errorEvents.includes(type)) return SecurityEventSeverity.ERROR;
  if (warningEvents.includes(type)) return SecurityEventSeverity.WARNING;
  return SecurityEventSeverity.INFO;
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  data: {
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
): ISecurityEvent {
  const event: ISecurityEvent = {
    id: generateEventId(),
    type,
    severity: getSeverityForEventType(type),
    timestamp: new Date(),
    ...data,
  };

  // Add to in-memory store
  securityEvents.push(event);

  // Trim old events if exceeding limit
  if (securityEvents.length > MAX_EVENTS_IN_MEMORY) {
    securityEvents.splice(0, securityEvents.length - MAX_EVENTS_IN_MEMORY);
  }

  // Log to console based on severity
  const logMessage = `[SECURITY] ${event.severity} - ${event.type}: ${JSON.stringify({
    userId: event.userId,
    ip: event.ipAddress,
    outcome: event.outcome,
    details: event.details,
  })}`;

  switch (event.severity) {
    case SecurityEventSeverity.CRITICAL:
      console.error(`🚨 ${logMessage}`);
      break;
    case SecurityEventSeverity.ERROR:
      console.error(`❌ ${logMessage}`);
      break;
    case SecurityEventSeverity.WARNING:
      console.warn(`⚠️ ${logMessage}`);
      break;
    default:
      console.log(`ℹ️ ${logMessage}`);
  }

  // Check for intrusion patterns
  checkForIntrusionPatterns(event);

  return event;
}

/**
 * Track failed login attempt
 */
export function trackFailedLogin(
  ipAddress: string,
  phoneNumber?: string,
  reason: string = 'Invalid credentials'
): IFailedLoginAttempt {
  const key = phoneNumber ? `phone:${phoneNumber}` : `ip:${ipAddress}`;
  const existing = failedLoginAttempts.get(key);

  const attempt: IFailedLoginAttempt = {
    ipAddress,
    phoneNumber,
    timestamp: new Date(),
    reason,
    attemptCount: (existing?.attemptCount || 0) + 1,
    isLocked: false,
    lockExpiresAt: undefined,
  };

  // Check if should be locked
  if (attempt.attemptCount >= MAX_FAILED_ATTEMPTS) {
    attempt.isLocked = true;
    attempt.lockExpiresAt = new Date(Date.now() + LOCKOUT_DURATION_MS);

    // Log brute force detection
    logSecurityEvent(SecurityEventType.BRUTE_FORCE_DETECTED, {
      ipAddress,
      outcome: 'failure',
      details: {
        phoneNumber,
        attemptCount: attempt.attemptCount,
        lockExpiresAt: attempt.lockExpiresAt,
      },
    });

    // Create intrusion alert
    createIntrusionAlert({
      type: 'BRUTE_FORCE',
      severity: SecurityEventSeverity.CRITICAL,
      ipAddress,
      description: `Brute force attack detected from IP ${ipAddress}`,
      indicators: [
        `${attempt.attemptCount} failed login attempts`,
        phoneNumber ? `Target phone: ${maskPhoneNumber(phoneNumber)}` : 'No specific target',
      ],
    });
  }

  failedLoginAttempts.set(key, attempt);

  // Log the failed attempt
  logSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
    ipAddress,
    outcome: 'failure',
    details: {
      phoneNumber: phoneNumber ? maskPhoneNumber(phoneNumber) : undefined,
      reason,
      attemptCount: attempt.attemptCount,
    },
  });

  return attempt;
}

/**
 * Check if login is locked
 */
export function isLoginLocked(ipAddress: string, phoneNumber?: string): boolean {
  const key = phoneNumber ? `phone:${phoneNumber}` : `ip:${ipAddress}`;
  const attempt = failedLoginAttempts.get(key);

  if (!attempt || !attempt.isLocked) {
    return false;
  }

  // Check if lock has expired
  if (attempt.lockExpiresAt && attempt.lockExpiresAt < new Date()) {
    // Reset the attempt
    failedLoginAttempts.delete(key);
    return false;
  }

  return true;
}

/**
 * Clear failed login attempts on successful login
 */
export function clearFailedLoginAttempts(ipAddress: string, phoneNumber?: string): void {
  const keys = [
    `ip:${ipAddress}`,
    phoneNumber ? `phone:${phoneNumber}` : null,
  ].filter(Boolean) as string[];

  keys.forEach(key => failedLoginAttempts.delete(key));
}

/**
 * Create audit trail entry
 */
export function createAuditTrailEntry(data: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent?: string;
  requestId?: string;
}): IAuditTrailEntry {
  const entry: IAuditTrailEntry = {
    id: generateEventId(),
    timestamp: new Date(),
    ...data,
  };

  auditTrail.push(entry);

  // Trim old entries
  if (auditTrail.length > MAX_EVENTS_IN_MEMORY) {
    auditTrail.splice(0, auditTrail.length - MAX_EVENTS_IN_MEMORY);
  }

  // Log audit entry
  console.log(`📝 [AUDIT] ${entry.action} on ${entry.resource}${entry.resourceId ? `:${entry.resourceId}` : ''} by user ${entry.userId}`);

  return entry;
}

/**
 * Create intrusion alert
 */
export function createIntrusionAlert(data: {
  type: string;
  severity: SecurityEventSeverity;
  ipAddress: string;
  description: string;
  indicators: string[];
}): IIntrusionAlert {
  const alert: IIntrusionAlert = {
    id: generateEventId(),
    timestamp: new Date(),
    isAcknowledged: false,
    ...data,
  };

  intrusionAlerts.push(alert);

  // Log critical alert
  console.error(`🚨 [INTRUSION ALERT] ${alert.type}: ${alert.description}`);
  console.error(`   Indicators: ${alert.indicators.join(', ')}`);

  return alert;
}

/**
 * Check for intrusion patterns
 */
function checkForIntrusionPatterns(event: ISecurityEvent): void {
  // Check for rapid-fire requests from same IP
  const recentEvents = securityEvents.filter(
    e => e.ipAddress === event.ipAddress &&
      e.timestamp > new Date(Date.now() - 60000) // Last minute
  );

  if (recentEvents.length > 100) {
    createIntrusionAlert({
      type: 'RAPID_FIRE_REQUESTS',
      severity: SecurityEventSeverity.WARNING,
      ipAddress: event.ipAddress,
      description: `Unusually high request rate from IP ${event.ipAddress}`,
      indicators: [`${recentEvents.length} requests in last minute`],
    });
  }

  // Check for multiple failed auth attempts
  const failedAuthEvents = recentEvents.filter(
    e => e.type === SecurityEventType.LOGIN_FAILURE ||
      e.type === SecurityEventType.OTP_FAILED ||
      e.type === SecurityEventType.INVALID_TOKEN
  );

  if (failedAuthEvents.length >= 3) {
    logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
      ipAddress: event.ipAddress,
      outcome: 'failure',
      details: {
        reason: 'Multiple authentication failures',
        failedAttempts: failedAuthEvents.length,
      },
    });
  }
}

/**
 * Get security events with filters
 */
export function getSecurityEvents(filters?: {
  type?: SecurityEventType;
  severity?: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): ISecurityEvent[] {
  let filtered = [...securityEvents];

  if (filters?.type) {
    filtered = filtered.filter(e => e.type === filters.type);
  }

  if (filters?.severity) {
    filtered = filtered.filter(e => e.severity === filters.severity);
  }

  if (filters?.userId) {
    filtered = filtered.filter(e => e.userId === filters.userId);
  }

  if (filters?.ipAddress) {
    filtered = filtered.filter(e => e.ipAddress === filters.ipAddress);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
  }

  if (filters?.endDate) {
    filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply limit
  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Get audit trail entries
 */
export function getAuditTrail(filters?: {
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): IAuditTrailEntry[] {
  let filtered = [...auditTrail];

  if (filters?.userId) {
    filtered = filtered.filter(e => e.userId === filters.userId);
  }

  if (filters?.resource) {
    filtered = filtered.filter(e => e.resource === filters.resource);
  }

  if (filters?.action) {
    filtered = filtered.filter(e => e.action === filters.action);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
  }

  if (filters?.endDate) {
    filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Get intrusion alerts
 */
export function getIntrusionAlerts(includeAcknowledged: boolean = false): IIntrusionAlert[] {
  let alerts = [...intrusionAlerts];

  if (!includeAcknowledged) {
    alerts = alerts.filter(a => !a.isAcknowledged);
  }

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Acknowledge intrusion alert
 */
export function acknowledgeIntrusionAlert(alertId: string, acknowledgedBy: string): boolean {
  const alert = intrusionAlerts.find(a => a.id === alertId);

  if (!alert) {
    return false;
  }

  alert.isAcknowledged = true;
  alert.acknowledgedBy = acknowledgedBy;
  alert.acknowledgedAt = new Date();

  return true;
}

/**
 * Get security metrics
 */
export function getSecurityMetrics(startDate: Date, endDate: Date): ISecurityMetrics {
  const periodEvents = securityEvents.filter(
    e => e.timestamp >= startDate && e.timestamp <= endDate
  );

  const loginAttempts = periodEvents.filter(
    e => e.type === SecurityEventType.LOGIN_SUCCESS || e.type === SecurityEventType.LOGIN_FAILURE
  );

  const blockedRequests = periodEvents.filter(
    e => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED ||
      e.type === SecurityEventType.ACCESS_DENIED ||
      e.type === SecurityEventType.CSRF_VIOLATION
  );

  const blockedByReason: Record<string, number> = {};
  blockedRequests.forEach(e => {
    blockedByReason[e.type] = (blockedByReason[e.type] || 0) + 1;
  });

  return {
    period: { start: startDate, end: endDate },
    loginAttempts: {
      total: loginAttempts.length,
      successful: loginAttempts.filter(e => e.type === SecurityEventType.LOGIN_SUCCESS).length,
      failed: loginAttempts.filter(e => e.type === SecurityEventType.LOGIN_FAILURE).length,
    },
    blockedRequests: {
      total: blockedRequests.length,
      byReason: blockedByReason,
    },
    suspiciousActivities: periodEvents.filter(
      e => e.type === SecurityEventType.SUSPICIOUS_ACTIVITY
    ).length,
    intrusionAlerts: intrusionAlerts.filter(
      a => a.timestamp >= startDate && a.timestamp <= endDate
    ).length,
    activeUsers: new Set(periodEvents.filter(e => e.userId).map(e => e.userId)).size,
    activeSessions: new Set(periodEvents.filter(e => e.sessionId).map(e => e.sessionId)).size,
  };
}

/**
 * Clean up old security events (call periodically)
 */
export function cleanupOldSecurityEvents(): void {
  const cutoffDate = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const initialEventCount = securityEvents.length;
  const initialAuditCount = auditTrail.length;
  const initialAlertCount = intrusionAlerts.length;

  // Remove old events
  while (securityEvents.length > 0 && securityEvents[0].timestamp < cutoffDate) {
    securityEvents.shift();
  }

  while (auditTrail.length > 0 && auditTrail[0].timestamp < cutoffDate) {
    auditTrail.shift();
  }

  while (intrusionAlerts.length > 0 && intrusionAlerts[0].timestamp < cutoffDate) {
    intrusionAlerts.shift();
  }

  const cleanedEvents = initialEventCount - securityEvents.length;
  const cleanedAudit = initialAuditCount - auditTrail.length;
  const cleanedAlerts = initialAlertCount - intrusionAlerts.length;

  if (cleanedEvents > 0 || cleanedAudit > 0 || cleanedAlerts > 0) {
    console.log(`🧹 Cleaned up security logs: ${cleanedEvents} events, ${cleanedAudit} audit entries, ${cleanedAlerts} alerts`);
  }
}

/**
 * Mask phone number for logging
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return '****';
  return phone.slice(0, 4) + '****' + phone.slice(-2);
}
