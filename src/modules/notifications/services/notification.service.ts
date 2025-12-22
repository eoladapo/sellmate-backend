import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../../di/tokens';
import { Notification } from '../entities';
import { NotificationRepository } from '../repositories';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../enums';
import {
  INotificationService,
  CreateNotificationRequest,
  NotificationFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { getSocketService } from '../../../shared/services/socket.service';
import { AppError } from '../../../api/middleware/error.middleware';

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(TOKENS.NotificationRepository) private notificationRepository: NotificationRepository
  ) { }

  async getNotifications(
    userId: string,
    filters?: NotificationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    return this.notificationRepository.findByUser(userId, filters, pagination);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.countUnread(userId);
  }

  async sendNotification(request: CreateNotificationRequest): Promise<Notification> {
    const channels = request.channels || [NotificationChannel.IN_APP];

    // Create notification record
    const notification = await this.notificationRepository.create({
      userId: request.userId,
      type: request.type,
      channel: channels[0], // Primary channel
      priority: request.priority || NotificationPriority.MEDIUM,
      status: NotificationStatus.PENDING,
      payload: request.payload,
      relatedEntityId: request.relatedEntityId,
      relatedEntityType: request.relatedEntityType,
    });

    // Dispatch to each channel
    for (const channel of channels) {
      await this.dispatchToChannel(notification, channel);
    }

    // Update status to sent
    return this.notificationRepository.update(notification.id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    const updated = await this.notificationRepository.markAsRead(notificationId);

    // Notify client that notification was marked as read
    const socketService = getSocketService();
    socketService.sendToUser(userId, 'notification:updated', {
      id: notificationId,
      isRead: true,
    });

    return updated;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const count = await this.notificationRepository.markAllAsRead(userId);

    // Notify client
    const socketService = getSocketService();
    socketService.sendToUser(userId, 'notifications:all_read', { count });

    return count;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    await this.notificationRepository.delete(notificationId);
  }

  /**
   * Dispatch notification to specific channel
   */
  private async dispatchToChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.sendInAppNotification(notification);
        break;
      case NotificationChannel.SMS:
        await this.sendSMSNotification(notification);
        break;
      case NotificationChannel.PUSH:
        // Future: implement push notifications
        console.log('Push notifications not yet implemented');
        break;
    }
  }

  /**
   * Send real-time in-app notification via Socket.IO
   */
  private async sendInAppNotification(notification: Notification): Promise<void> {
    const socketService = getSocketService();

    socketService.sendToUser(notification.userId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
      payload: notification.payload,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
      createdAt: notification.createdAt,
    });

    // Update delivery status if user is online
    if (socketService.isUserOnline(notification.userId)) {
      await this.notificationRepository.update(notification.id, {
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      });
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: Notification): Promise<void> {
    // SMS notifications are not yet implemented
    // Get user's phone number (would need to be passed or fetched)
    // For now, we'll skip SMS if no phone number is available
    console.log(`SMS notification would be sent for notification ${notification.id}`);
  }

  // ============================================
  // Convenience methods for common notifications
  // ============================================

  /**
   * Send new message notification
   */
  async notifyNewMessage(
    userId: string,
    customerName: string,
    platform: string,
    conversationId: string
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.NEW_MESSAGE,
      payload: {
        title: 'New Message',
        body: `${customerName} sent you a message on ${platform}`,
        actionUrl: `/conversations/${conversationId}`,
        data: { customerName, platform, conversationId },
      },
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.HIGH,
      relatedEntityId: conversationId,
      relatedEntityType: 'conversation',
    });
  }

  /**
   * Send order detected notification
   */
  async notifyOrderDetected(
    userId: string,
    customerName: string,
    productName: string,
    conversationId: string
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.ORDER_DETECTED,
      payload: {
        title: 'Potential Order Detected',
        body: `${customerName} may want to order ${productName}`,
        actionUrl: `/conversations/${conversationId}`,
        data: { customerName, productName, conversationId },
      },
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.HIGH,
      relatedEntityId: conversationId,
      relatedEntityType: 'conversation',
    });
  }

  /**
   * Send order status changed notification
   */
  async notifyOrderStatusChanged(
    userId: string,
    orderId: string,
    oldStatus: string,
    newStatus: string,
    customerName: string
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.ORDER_STATUS_CHANGED,
      payload: {
        title: 'Order Status Updated',
        body: `Order for ${customerName} changed from ${oldStatus} to ${newStatus}`,
        actionUrl: `/orders/${orderId}`,
        data: { orderId, oldStatus, newStatus, customerName },
      },
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.MEDIUM,
      relatedEntityId: orderId,
      relatedEntityType: 'order',
    });
  }

  /**
   * Send order expiring notification
   */
  async notifyOrderExpiring(
    userId: string,
    orderId: string,
    customerName: string,
    hoursRemaining: number
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.ORDER_EXPIRING,
      payload: {
        title: 'Order Expiring Soon',
        body: `Order for ${customerName} will expire in ${hoursRemaining} hours`,
        actionUrl: `/orders/${orderId}`,
        data: { orderId, customerName, hoursRemaining },
      },
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.HIGH,
      relatedEntityId: orderId,
      relatedEntityType: 'order',
    });
  }

  /**
   * Send new customer notification
   */
  async notifyNewCustomer(
    userId: string,
    customerId: string,
    customerName: string,
    platform: string
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.NEW_CUSTOMER,
      payload: {
        title: 'New Customer',
        body: `${customerName} is now a customer from ${platform}`,
        actionUrl: `/customers/${customerId}`,
        data: { customerId, customerName, platform },
      },
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.LOW,
      relatedEntityId: customerId,
      relatedEntityType: 'customer',
    });
  }

  /**
   * Send integration error notification
   */
  async notifyIntegrationError(
    userId: string,
    platform: string,
    errorMessage: string
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.INTEGRATION_ERROR,
      payload: {
        title: 'Integration Error',
        body: `There was an issue with your ${platform} connection: ${errorMessage}`,
        actionUrl: '/settings/integrations',
        data: { platform, errorMessage },
      },
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.URGENT,
    });
  }
}
