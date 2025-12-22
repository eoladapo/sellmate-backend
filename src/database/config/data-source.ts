import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

/**
 * TypeORM DataSource Configuration
 * Configures PostgreSQL connection with connection pooling and migration support
 */
const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'sellmate_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  database: process.env.DB_NAME || 'sellmate_db',

  // Connection pooling configuration
  extra: {
    max: 20, // Maximum number of connections in the pool
    min: 5, // Minimum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Connection timeout: 10 seconds
  },

  // Entity discovery
  entities: [
    path.join(__dirname, '../../modules/**/entities/*.entity{.ts,.js}'),
  ],

  // Migration configuration
  migrations: [
    path.join(__dirname, '../migrations/*{.ts,.js}'),
  ],

  // Subscribers for entity events
  subscribers: [],

  // Development settings
  synchronize: process.env.DB_SYNCHRONIZE === 'true', // NEVER use in production
  logging: process.env.DB_LOGGING === 'true' ? ['query', 'error', 'warn'] : false,

  // Additional options
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    duration: 30000, // Cache duration: 30 seconds
  },

  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
};

// Create and export the DataSource instance
export const AppDataSource = new DataSource(dataSourceOptions);

/**
 * Initialize database connection
 * @returns Promise<DataSource>
 */
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established successfully');
      console.log(`Connected to: ${process.env.DB_DATABASE}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error initializing database connection:', error);
    throw error;
  }
};

/**
 * Close database connection
 * @returns Promise<void>
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed successfully');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

/**
 * Get the initialized DataSource instance
 * @returns DataSource
 */
export const getDataSource = (): DataSource => {
  if (!AppDataSource.isInitialized) {
    throw new Error('DataSource is not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
};
