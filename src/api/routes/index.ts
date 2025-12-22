import { Router } from 'express';
import v1Routes from './v1';
import healthRoutes from './health.routes';

/**
 * Main API router
 * Handles API versioning and route organization
 */
const router = Router();

/**
 * Health check routes (outside of versioning)
 */
router.use('/health', healthRoutes);

/**
 * API version 1 routes
 */
router.use('/v1', v1Routes);

/**
 * API version information endpoint
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'SellMate API',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    documentation: '/api/v1/docs',
    availableVersions: ['v1'],
    endpoints: {
      v1: '/api/v1',
      health: '/api/health',
      healthDetailed: '/api/health/detailed',
      healthReady: '/api/health/ready',
      healthLive: '/api/health/live',
      docs: '/api/v1/docs',
    },
  });
});

export default router;