import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TOKENS } from '../../../di/tokens';
import { NotificationService } from '../services';
import { GetNotificationsQuerySchema } from '../dto';
import { successResponse } from '../../../shared/utils/response.util';

@injectable()
export class NotificationController {
  constructor(@inject(TOKENS.NotificationService) private notificationService: NotificationService) { }

  /**
   * GET /api/v1/notifications
   * Get user notifications
   */
  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const query = GetNotificationsQuerySchema.parse(req.query);
      const result = await this.notificationService.getNotifications(
        userId,
        {
          type: query.type,
          isRead: query.isRead,
          status: query.status,
        },
        {
          page: query.page,
          limit: query.limit,
        }
      );

      successResponse(res, result.data, 'Notifications retrieved', 200, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notification count
   */
  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await this.notificationService.getUnreadCount(userId);
      successResponse(res, { count }, 'Unread count retrieved');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/notifications/:id/read
   * Mark notification as read
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id, userId);
      successResponse(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await this.notificationService.markAllAsRead(userId);
      successResponse(res, { count }, `${count} notifications marked as read`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/notifications/:id
   * Delete notification
   */
  deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await this.notificationService.deleteNotification(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
