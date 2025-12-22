import { Router } from 'express';
import { AnalyticsController } from '../../../modules/analytics/controllers';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics period
 *     responses:
 *       200:
 *         description: Dashboard metrics including revenue, profit, orders, and customers
 */
router.get('/dashboard', authMiddleware, bind<AnalyticsController>(TOKENS.AnalyticsController, 'getDashboardMetrics'));

/**
 * @swagger
 * /api/v1/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Revenue analytics with platform breakdown and trends
 */
router.get('/revenue', authMiddleware, bind<AnalyticsController>(TOKENS.AnalyticsController, 'getRevenueAnalytics'));

/**
 * @swagger
 * /api/v1/analytics/customers:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Customer analytics with segmentation and top customers
 */
router.get('/customers', authMiddleware, bind<AnalyticsController>(TOKENS.AnalyticsController, 'getCustomerAnalytics'));

/**
 * @swagger
 * /api/v1/analytics/export:
 *   get:
 *     summary: Export analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Analytics report file
 */
router.get('/export', authMiddleware, bind<AnalyticsController>(TOKENS.AnalyticsController, 'exportReport'));

export default router;
