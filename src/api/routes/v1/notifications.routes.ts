import { Router, Request, Response, NextFunction } from 'express';
import { NotificationController } from '../../../modules/notifications/controllers';
import { authMiddleware } from '../../middleware';
import { getService } from '../../../container';

const router = Router();

const getNotificationController = (): NotificationController =>
  getService<NotificationController>('NotificationController');

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [new_message, order_detected, order_status_changed, order_expiring, order_expired, new_customer, low_inventory, profit_alert, integration_error, system]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getNotificationController().getNotifications(req, res, next);
});

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
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
 *                     count:
 *                       type: integer
 */
router.get('/unread-count', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getNotificationController().getUnreadCount(req, res, next);
});

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
 *                     count:
 *                       type: integer
 */
router.put('/read-all', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getNotificationController().markAllAsRead(req, res, next);
});

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getNotificationController().markAsRead(req, res, next);
});

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Notification deleted
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getNotificationController().deleteNotification(req, res, next);
});

export default router;
