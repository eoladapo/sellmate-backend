/**
 * HTTPS Enforcement Middleware
 * Ensures secure connections in production
 * Requirements: 8.2, 8.4
 */

import { Request, Response, NextFunction } from 'express';
import { tlsConfig } from '../../config/security.config';

/**
 * Enforce HTTPS connections in production
 * Redirects HTTP requests to HTTPS
 */
export const enforceHttps = (req: Request, res: Response, next: NextFunction): void => {
  // Skip in development
  if (!tlsConfig.enforceHttps) {
    return next();
  }

  // Check if request is already secure
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (isSecure) {
    return next();
  }

  // Allow health checks over HTTP (for load balancer health checks)
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  // Redirect to HTTPS
  const httpsUrl = `https://${req.hostname}${req.originalUrl}`;
  console.log(`🔒 Redirecting HTTP to HTTPS: ${req.originalUrl}`);
  res.redirect(301, httpsUrl);
};

/**
 * Add HSTS header for secure connections
 * Strict-Transport-Security header
 */
export const hstsHeader = (_req: Request, res: Response, next: NextFunction): void => {
  if (tlsConfig.enforceHttps) {
    const hstsValue = [
      `max-age=${tlsConfig.hsts.maxAge}`,
      tlsConfig.hsts.includeSubDomains ? 'includeSubDomains' : '',
      tlsConfig.hsts.preload ? 'preload' : '',
    ]
      .filter(Boolean)
      .join('; ');

    res.setHeader('Strict-Transport-Security', hstsValue);
  }
  next();
};

/**
 * Add security headers for TLS connections
 */
export const tlsSecurityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Expect-CT header (Certificate Transparency)
  // Note: This is being deprecated but still useful for older browsers
  if (tlsConfig.enforceHttps) {
    res.setHeader('Expect-CT', 'max-age=86400, enforce');
  }

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
};

/**
 * Validate TLS version (for logging/monitoring)
 * Note: Actual TLS version enforcement is done at the server/load balancer level
 */
export const validateTlsVersion = (req: Request, _res: Response, next: NextFunction): void => {
  // Get TLS version from socket (if available)
  const socket = req.socket as any;
  const tlsVersion = socket?.getProtocol?.();

  if (tlsVersion) {
    // Log TLS version for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 TLS Version: ${tlsVersion}`);
    }

    // Warn about deprecated TLS versions
    const deprecatedVersions = ['TLSv1', 'TLSv1.1'];
    if (deprecatedVersions.includes(tlsVersion)) {
      console.warn(`⚠️ Deprecated TLS version detected: ${tlsVersion} from ${req.ip}`);
    }
  }

  next();
};

/**
 * Combined HTTPS security middleware
 */
export const httpsSecurityMiddleware = [
  enforceHttps,
  hstsHeader,
  tlsSecurityHeaders,
];
