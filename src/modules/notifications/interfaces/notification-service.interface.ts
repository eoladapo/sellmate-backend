import { Notification, NotificationPayload } from '../entities';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../enums';
import {
  NotificationFilters,
  PaginationOptions,
  PaginatedResult,
} from './notification-repository.interface';

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface NotificationPreferences {
  newMessage: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  orderDetected: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  orderStatusChanged: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  orderExpiring: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  lowInventory: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  profitAlert: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
}

export interface INotificationService {
  getNotifications(
    userId: string,
    filters?: NotificationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;
  getUnreadCount(userId: string): Promise<number>;
  sendNotification(request: CreateNotificationRequest): Promise<Notification>;
  markAsRead(notificationId: string, userId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<number>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
}
