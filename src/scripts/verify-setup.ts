import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../database/config/data-source';
import { initializeRedis, closeRedis } from '../config/redis.config';

dotenv.config();

/**
 * Setup Verification Script
 * Verifies that all required services are properly configured and accessible
 */

interface VerificationResult {
  service: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

/**
 * Verify environment variables
 */
const verifyEnvironmentVariables = (): void => {
  console.log('🔍 Verifying environment variables...\n');

  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'REDIS_HOST',
    'REDIS_PORT',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missing: string[] = [];
  const present: string[] = [];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      present.push(varName);
    }
  });

  if (missing.length === 0) {
    results.push({
      service: 'Environment Variables',
      status: 'success',
      message: 'All required environment variables are set',
      details: { count: present.length },
    });
    console.log('✅ All required environment variables are set');
  } else {
    results.push({
      service: 'Environment Variables',
      status: 'error',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: { missing, present },
    });
    console.log(`❌ Missing environment variables: ${missing.join(', ')}`);
  }

  // Check for dangerous settings
  if (process.env.NODE_ENV === 'production' && process.env.DB_SYNCHRONIZE === 'true') {
    results.push({
      service: 'Database Configuration',
      status: 'warning',
      message: 'DB_SYNCHRONIZE is enabled in production - this is dangerous!',
    });
    console.log('⚠️  WARNING: DB_SYNCHRONIZE is enabled in production');
  }

  console.log('');
};

/**
 * Verify PostgreSQL connection
 */
const verifyPostgreSQL = async (): Promise<void> => {
  console.log('🔍 Verifying PostgreSQL connection...\n');

  try {
    const dataSource = await initializeDatabase();

    // Test basic query
    const result = await dataSource.query('SELECT version() as version, NOW() as time');
    const version = result[0].version.split(' ')[1];

    // Check connection pool (safely handle different TypeORM versions)
    let poolSize = 'N/A';
    try {
      const driver = dataSource.driver as any;
      if (driver.master && driver.master.totalCount !== undefined) {
        poolSize = driver.master.totalCount;
      } else if (driver.pool && driver.pool.totalCount !== undefined) {
        poolSize = driver.pool.totalCount;
      } else if (driver.pool && driver.pool.size !== undefined) {
        poolSize = driver.pool.size;
      }
    } catch (error) {
      // Pool size information not available
      poolSize = 'Unknown';
    }

    results.push({
      service: 'PostgreSQL',
      status: 'success',
      message: 'Database connection successful',
      details: {
        version,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        poolSize,
      },
    });

    console.log('✅ PostgreSQL connection successful');
    console.log(`   Version: ${version}`);
    console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    console.log(`   Pool Size: ${poolSize}`);
  } catch (error: any) {
    results.push({
      service: 'PostgreSQL',
      status: 'error',
      message: 'Database connection failed',
      details: { error: error.message },
    });
    console.log('❌ PostgreSQL connection failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');
};

/**
 * Verify Redis connection
 */
const verifyRedis = async (): Promise<void> => {
  console.log('🔍 Verifying Redis connection...\n');

  try {
    const client = await initializeRedis();

    // Test basic operations
    const testKey = 'verify:test';
    await client.set(testKey, 'test-value');
    const value = await client.get(testKey);
    await client.del(testKey);

    if (value === 'test-value') {
      results.push({
        service: 'Redis',
        status: 'success',
        message: 'Redis connection successful',
        details: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          database: process.env.REDIS_DB,
        },
      });

      console.log('✅ Redis connection successful');
      console.log(`   Host: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
      console.log(`   Database: ${process.env.REDIS_DB}`);
      console.log('   Read/Write operations: OK');
    } else {
      throw new Error('Redis read/write test failed');
    }
  } catch (error: any) {
    results.push({
      service: 'Redis',
      status: 'error',
      message: 'Redis connection failed',
      details: { error: error.message },
    });
    console.log('❌ Redis connection failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');
};

/**
 * Verify TypeORM configuration
 */
const verifyTypeORMConfig = (): void => {
  console.log('🔍 Verifying TypeORM configuration...\n');

  try {
    const { AppDataSource } = require('../database/config/data-source');

    const hasEntities = AppDataSource.options.entities && AppDataSource.options.entities.length > 0;
    const hasMigrations = AppDataSource.options.migrations && AppDataSource.options.migrations.length > 0;

    if (hasEntities && hasMigrations) {
      results.push({
        service: 'TypeORM Configuration',
        status: 'success',
        message: 'TypeORM is properly configured',
        details: {
          entities: 'configured',
          migrations: 'configured',
          synchronize: AppDataSource.options.synchronize,
        },
      });
      console.log('✅ TypeORM configuration is valid');
      console.log(`   Entities: configured`);
      console.log(`   Migrations: configured`);
      console.log(`   Synchronize: ${AppDataSource.options.synchronize}`);
    } else {
      results.push({
        service: 'TypeORM Configuration',
        status: 'warning',
        message: 'TypeORM configuration incomplete',
        details: { hasEntities, hasMigrations },
      });
      console.log('⚠️  TypeORM configuration incomplete');
    }
  } catch (error: any) {
    results.push({
      service: 'TypeORM Configuration',
      status: 'error',
      message: 'Failed to load TypeORM configuration',
      details: { error: error.message },
    });
    console.log('❌ Failed to load TypeORM configuration');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');
};

/**
 * Print summary
 */
const printSummary = (): void => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('                    SUMMARY                            ');
  console.log('═══════════════════════════════════════════════════════\n');

  const successCount = results.filter((r) => r.status === 'success').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}\n`);

  if (errorCount > 0) {
    console.log('❌ Setup verification failed. Please fix the errors above.\n');
    console.log('Common solutions:');
    console.log('1. Ensure PostgreSQL is running: sudo systemctl start postgresql');
    console.log('2. Ensure Redis is running: sudo systemctl start redis-server');
    console.log('3. Check .env file has correct credentials');
    console.log('4. Create database: psql -U postgres -c "CREATE DATABASE sellmate_db;"');
    console.log('5. Run: npm run db:test for detailed connection testing\n');
  } else if (warningCount > 0) {
    console.log('⚠️  Setup verification completed with warnings.\n');
  } else {
    console.log('✅ All checks passed! Your setup is ready.\n');
    console.log('Next steps:');
    console.log('1. Run migrations: npm run migration:run');
    console.log('2. Start development server: npm run dev');
    console.log('3. Check health endpoint: http://localhost:3000/health\n');
  }
};

/**
 * Run all verifications
 */
const runVerification = async (): Promise<void> => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('         SellMate Backend Setup Verification           ');
  console.log('═══════════════════════════════════════════════════════\n');

  verifyEnvironmentVariables();
  verifyTypeORMConfig();
  await verifyPostgreSQL();
  await verifyRedis();

  printSummary();

  // Cleanup
  await closeDatabase();
  await closeRedis();

  // Exit with appropriate code
  const hasErrors = results.some((r) => r.status === 'error');
  process.exit(hasErrors ? 1 : 0);
};

// Run verification
runVerification().catch((error) => {
  console.error('❌ Fatal error during verification:', error);
  process.exit(1);
});
