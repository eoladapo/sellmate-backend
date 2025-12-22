import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Database Configuration
 * Centralized database configuration settings
 */
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'sellmate_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  database: process.env.DB_DATABASE || 'sellmate_db',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',

  // Connection pool settings
  pool: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },

  // SSL settings
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
};

/**
 * Validate database configuration
 * @throws Error if required configuration is missing
 */
export const validateDatabaseConfig = (): void => {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }

  // Warn about synchronize in production
  if (process.env.NODE_ENV === 'production' && process.env.DB_SYNCHRONIZE === 'true') {
    console.warn('⚠️  WARNING: DB_SYNCHRONIZE is enabled in production. This is dangerous!');
  }
};
