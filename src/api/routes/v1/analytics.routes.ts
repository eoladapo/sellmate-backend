import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsController } from '../../../modules/analytics/controllers';
import { authMiddleware } from '../../middleware';
import { container, TOKENS } from '../../../di';

const router = Router();

const getAnalyticsController = (): AnalyticsController =>
  container.resolve<AnalyticsController>(TOKENS.AnalyticsController);

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
 *                     revenue:
 *                       type: object
 *                     profit:
 *                       type: object
 *                     orders:
 *                       type: object
 *                     customers:
 *                       type: object
 */
router.get('/dashboard', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAnalyticsController().getDashboardMetrics(req, res, next);
});

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
 *                     total:
 *                       type: number
 *                     byPlatform:
 *                       type: object
 *                       properties:
 *                         whatsapp:
 *                           type: number
 *                         instagram:
 *                           type: number
 *                         manual:
 *                           type: number
 *                     trend:
 *                       type: string
 *                       enum: [increasing, decreasing, stable]
 *                     percentageChange:
 *                       type: number
 */
router.get('/revenue', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAnalyticsController().getRevenueAnalytics(req, res, next);
});

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
 *                     totalCustomers:
 *                       type: number
 *                     newCustomers:
 *                       type: number
 *                     returningCustomers:
 *                       type: number
 *                     topCustomers:
 *                       type: array
 */
router.get('/customers', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAnalyticsController().getCustomerAnalytics(req, res, next);
});

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
 *       - in: query
 *         name: includeOrders
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeCustomers
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeProfit
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Analytics report file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAnalyticsController().exportReport(req, res, next);
});

export default router;
