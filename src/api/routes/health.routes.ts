import { Router, Request, Response } from 'express';
import { healthService } from '../../shared/services/health.service';
import { successResponse, customResponse } from '../../shared/utils/response.util';

/**
 * Health check routes
 * Provides various health endpoints for monitoring and load balancers
 */
const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Returns the basic health status of the API including database and Redis connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 version:
 *                   type: string
 *                   example: v1
 *                 environment:
 *                   type: string
 *                   example: development
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [connected, disconnected, error]
 *                     redis:
 *                       type: string
 *                       enum: [connected, disconnected, error]
 *       503:
 *         description: System is unhealthy
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const health = await healthService.getSystemHealth();

    const statusCode = health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 200 : 503;

    return res.status(statusCode).json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      version: health.version,
      environment: health.environment,
      services: {
        database: health.services.database.status,
        redis: health.services.redis.status,
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.API_VERSION || 'v1',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns comprehensive health information including all service statuses and system metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     version:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             responseTime:
 *                               type: number
 *                         redis:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             responseTime:
 *                               type: number
 *       503:
 *         description: Health check failed
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const health = await healthService.getSystemHealth();

    const statusCode = health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 200 : 503;

    return successResponse(res, health, 'Detailed health check', statusCode);
  } catch (error) {
    return customResponse(
      res,
      503,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      'Health check failed',
      false
    );
  }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Kubernetes liveness probe
 *     description: Returns 200 if the application is running. Used by Kubernetes to determine if the container should be restarted.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Application is not responding
 */
router.get('/live', async (_req: Request, res: Response) => {
  try {
    const isAlive = await healthService.isAlive();

    if (isAlive) {
      return res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Liveness check failed',
    });
  }
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Kubernetes readiness probe
 *     description: Returns 200 if the application is ready to serve traffic. Used by Kubernetes to determine if traffic should be routed to this pod.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready to serve traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Application is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not_ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const isReady = await healthService.isReady();

    if (isReady) {
      return res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
});

export default router;