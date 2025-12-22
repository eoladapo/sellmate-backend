export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  ORDER_DETECTED = 'order_detected',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_EXPIRING = 'order_expiring',
  ORDER_EXPIRED = 'order_expired',
  NEW_CUSTOMER = 'new_customer',
  LOW_INVENTORY = 'low_inventory',
  PROFIT_ALERT = 'profit_alert',
  INTEGRATION_ERROR = 'integration_error',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  SMS = 'sms',
  PUSH = 'push', // Future: mobile push notifications
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}
