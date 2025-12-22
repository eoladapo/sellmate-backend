import { Notification } from '../entities';
import { NotificationType, NotificationStatus } from '../enums';

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  status?: NotificationStatus;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByUser(
    userId: string,
    filters?: NotificationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;
  countUnread(userId: string): Promise<number>;
  create(data: Partial<Notification>): Promise<Notification>;
  update(id: string, data: Partial<Notification>): Promise<Notification>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
  deleteOlderThan(userId: string, date: Date): Promise<number>;
}
