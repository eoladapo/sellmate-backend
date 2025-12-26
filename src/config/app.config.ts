import { config } from 'dotenv';

// Load environment variables
config();

// Environment validation and defaults
const envSchema = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_NAME: process.env.DB_NAME || 'sellmate_db',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT Secrets
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_ACCESS_SECRET is required in production');
    }
    return 'dev_jwt_access_secret_32_chars___';
  })(),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET is required in production');
    }
    return 'dev_jwt_refresh_secret_32_chars__';
  })(),

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY is required in production');
    }
    return 'dev_encryption_key_32_characters_';
  })(),

  // SMS Provider (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,

  // AI Provider (Gemini)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // Payment Provider (Paystack)
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,

  // Meta Platform (WhatsApp + Instagram use the same Meta App)
  META_APP_ID: process.env.META_APP_ID,
  META_APP_SECRET: process.env.META_APP_SECRET,
  WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID: process.env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID,
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,

  // Base URL for OAuth callbacks
  BASE_URL: process.env.BASE_URL,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// Validate required secrets in production
if (envSchema.NODE_ENV === 'production') {
  const requiredSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY'];
  for (const secret of requiredSecrets) {
    if (!process.env[secret] || process.env[secret]!.length < 32) {
      throw new Error(`${secret} must be at least 32 characters in production`);
    }
  }
}

// Application configuration
export const appConfig = {
  // Application
  nodeEnv: envSchema.NODE_ENV,
  port: envSchema.PORT,
  isDevelopment: envSchema.NODE_ENV === 'development',
  isProduction: envSchema.NODE_ENV === 'production',
  isTest: envSchema.NODE_ENV === 'test',

  // Database
  database: {
    host: envSchema.DB_HOST,
    port: envSchema.DB_PORT,
    username: envSchema.DB_USERNAME,
    password: envSchema.DB_PASSWORD,
    name: envSchema.DB_NAME,
  },

  // Redis
  redis: {
    url: envSchema.REDIS_URL,
  },

  // JWT
  jwt: {
    accessSecret: envSchema.JWT_ACCESS_SECRET,
    refreshSecret: envSchema.JWT_REFRESH_SECRET,
    accessTokenExpiry: 15 * 60, // 15 minutes
    refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
  },

  // Encryption
  encryption: {
    key: envSchema.ENCRYPTION_KEY,
  },

  // SMS
  sms: {
    provider: 'twilio',
    twilio: {
      accountSid: envSchema.TWILIO_ACCOUNT_SID,
      authToken: envSchema.TWILIO_AUTH_TOKEN,
      phoneNumber: envSchema.TWILIO_PHONE_NUMBER,
    },
  },

  // AI
  ai: {
    gemini: {
      apiKey: envSchema.GEMINI_API_KEY,
    },
  },

  // Payment (Paystack)
  paystack: {
    secretKey: envSchema.PAYSTACK_SECRET_KEY,
    publicKey: envSchema.PAYSTACK_PUBLIC_KEY,
    webhookSecret: envSchema.PAYSTACK_WEBHOOK_SECRET,
  },

  // Meta Platform (shared between WhatsApp and Instagram)
  social: {
    // Both WhatsApp and Instagram use the same Meta App credentials
    whatsapp: {
      appId: envSchema.META_APP_ID,
      appSecret: envSchema.META_APP_SECRET,
      embeddedSignupConfigId: envSchema.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID,
      webhookVerifyToken: envSchema.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    },
    instagram: {
      appId: envSchema.META_APP_ID, // Same as WhatsApp
      appSecret: envSchema.META_APP_SECRET, // Same as WhatsApp
      webhookVerifyToken: envSchema.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
    },
  },

  // Base URL for OAuth callbacks
  baseUrl: envSchema.BASE_URL,

  // CORS
  cors: {
    origin: envSchema.CORS_ORIGIN,
  },

  // OTP Configuration
  otp: {
    expiryMinutes: 10,
    maxAttempts: 3,
    lockoutMinutes: 15,
    progressiveDelays: [0, 30, 60, 300], // 0s, 30s, 1min, 5min
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // per window
  },
};

export type AppConfig = typeof appConfig;