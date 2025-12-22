import { Router } from 'express';
import { NotificationController } from '../../../modules/notifications/controllers';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authMiddleware, bind<NotificationController>(TOKENS.NotificationController, 'getNotifications'));

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
 */
router.get('/unread-count', authMiddleware, bind<NotificationController>(TOKENS.NotificationController, 'getUnreadCount'));

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
 */
router.put('/read-all', authMiddleware, bind<NotificationController>(TOKENS.NotificationController, 'markAllAsRead'));

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', authMiddleware, bind<NotificationController>(TOKENS.NotificationController, 'markAsRead'));

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Notification deleted
 */
router.delete('/:id', authMiddleware, bind<NotificationController>(TOKENS.NotificationController, 'deleteNotification'));

export default router;
