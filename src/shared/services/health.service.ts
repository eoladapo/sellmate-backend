import { AppDataSource } from '../../database/config/data-source';
import { getRedisClient } from '../../config/redis.config';

/**
 * Health check service
 * Centralized health monitoring for all system components
 */
export class HealthService {
  /**
   * Check database connection status
   */
  async checkDatabase(): Promise<{ status: string; details?: any }> {
    try {
      if (!AppDataSource.isInitialized) {
        return { status: 'disconnected', details: 'Database not initialized' };
      }

      // Simple query to verify connection
      await AppDataSource.query('SELECT 1');

      const options = AppDataSource.options as any; // Cast to access PostgreSQL-specific properties
      return {
        status: 'connected',
        details: {
          type: 'postgresql',
          database: options.database,
          host: options.host,
          port: options.port,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Check Redis connection status
   */
  async checkRedis(): Promise<{ status: string; details?: any }> {
    try {
      const redisClient = getRedisClient();

      if (!redisClient) {
        return { status: 'not_configured', details: 'Redis client not initialized' };
      }

      if (!redisClient.isOpen) {
        return { status: 'disconnected', details: 'Redis connection closed' };
      }

      // Test Redis with a simple ping
      await redisClient.ping();

      return {
        status: 'connected',
        details: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || '6379',
          database: process.env.REDIS_DB || '0',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }

  /**
   * Check external API dependencies (future use)
   */
  async checkExternalAPIs(): Promise<{ status: string; details?: any }> {
    // This will be implemented when we add WhatsApp/Instagram integrations
    return {
      status: 'not_configured',
      details: 'External API checks not implemented yet',
    };
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    services: {
      database: { status: string; details?: any };
      redis: { status: string; details?: any };
      externalAPIs: { status: string; details?: any };
    };
  }> {
    const [database, redis, externalAPIs] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
    ]);

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (database.status === 'error') {
      overallStatus = 'unhealthy'; // Database is critical
    } else if (redis.status === 'error' || redis.status === 'disconnected') {
      overallStatus = 'degraded'; // Redis issues are degraded service
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.API_VERSION || 'v1',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database,
        redis,
        externalAPIs,
      },
    };
  }

  /**
   * Simple liveness check (for Kubernetes liveness probe)
   */
  async isAlive(): Promise<boolean> {
    // Basic check - is the process running?
    return true;
  }

  /**
   * Readiness check (for Kubernetes readiness probe)
   */
  async isReady(): Promise<boolean> {
    try {
      const database = await this.checkDatabase();
      // Service is ready if database is connected
      return database.status === 'connected';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const healthService = new HealthService();