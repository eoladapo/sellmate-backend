/**
 * Security Configuration
 * Centralized security settings for the SellMate platform
 * Requirements: 8.2, 8.4
 */

import { config } from 'dotenv';

config();

/**
 * CORS whitelist configuration
 */
export const corsConfig = {
  // Allowed origins for API requests
  allowedOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'],

  // Admin-only origins (for sensitive endpoints)
  adminOrigins: process.env.ADMIN_ORIGINS
    ? process.env.ADMIN_ORIGINS.split(',').map(origin => origin.trim())
    : [],

  // Webhook origins (for external services)
  webhookOrigins: process.env.WEBHOOK_ORIGINS
    ? process.env.WEBHOOK_ORIGINS.split(',').map(origin => origin.trim())
    : ['https://graph.facebook.com', 'https://api.paystack.co'],
};

/**
 * HTTPS/TLS configuration
 */
export const tlsConfig = {
  // Enforce HTTPS in production
  enforceHttps: process.env.NODE_ENV === 'production',

  // HSTS settings
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // Minimum TLS version (for documentation/deployment)
  minTlsVersion: 'TLSv1.3',
};

/**
 * Content Security Policy configuration
 */
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    scriptSrc: ["'self'"],
    connectSrc: [
      "'self'",
      'https://api.gemini.google.com',
      'https://graph.facebook.com',
      'https://api.instagram.com',
      'https://api.paystack.co',
    ],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
  // Upgrade insecure requests in production
  upgradeInsecureRequests: process.env.NODE_ENV === 'production',
};

/**
 * CSRF protection configuration
 */
export const csrfConfig = {
  // Enable CSRF protection
  enabled: process.env.CSRF_ENABLED !== 'false',

  // Cookie settings for CSRF token
  cookie: {
    name: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 3600000, // 1 hour
  },

  // Header name for CSRF token
  headerName: 'X-CSRF-Token',

  // Routes to exclude from CSRF protection (webhooks, public APIs)
  excludeRoutes: [
    '/api/v1/webhooks',
    '/api/health',
    '/api/v1/auth/oauth',
  ],
};

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },

  // Authentication rate limit
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
  },

  // OTP rate limit
  otp: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3,
  },

  // AI API rate limit
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
  },

  // Webhook rate limit
  webhook: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
  },
};

/**
 * Session security configuration
 */
export const sessionConfig = {
  // Session timeout in milliseconds
  timeout: 30 * 60 * 1000, // 30 minutes of inactivity

  // Absolute session expiry
  absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours

  // Cookie settings
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

/**
 * Security headers configuration
 */
export const securityHeadersConfig = {
  // X-Frame-Options
  frameOptions: 'DENY',

  // X-Content-Type-Options
  contentTypeOptions: 'nosniff',

  // X-XSS-Protection (legacy, but still useful)
  xssProtection: '1; mode=block',

  // Referrer-Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions-Policy (formerly Feature-Policy)
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: ['self'],
  },
};

/**
 * Trusted proxy configuration
 */
export const proxyConfig = {
  // Trust proxy for accurate IP addresses
  trustProxy: process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production',

  // Number of proxies to trust (for X-Forwarded-For)
  proxyCount: parseInt(process.env.PROXY_COUNT || '1', 10),
};

export type SecurityConfig = {
  cors: typeof corsConfig;
  tls: typeof tlsConfig;
  csp: typeof cspConfig;
  csrf: typeof csrfConfig;
  rateLimit: typeof rateLimitConfig;
  session: typeof sessionConfig;
  headers: typeof securityHeadersConfig;
  proxy: typeof proxyConfig;
};

export const securityConfig: SecurityConfig = {
  cors: corsConfig,
  tls: tlsConfig,
  csp: cspConfig,
  csrf: csrfConfig,
  rateLimit: rateLimitConfig,
  session: sessionConfig,
  headers: securityHeadersConfig,
  proxy: proxyConfig,
};
