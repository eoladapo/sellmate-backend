/**
 * Notification channel types
 */
export enum NotificationChannelType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
}

/**
 * Data retention period options
 */
export enum DataRetentionPeriod {
  THIRTY_DAYS = 30,
  SIXTY_DAYS = 60,
  NINETY_DAYS = 90,
  ONE_YEAR = 365,
  INDEFINITE = -1,
}

/**
 * Sync interval options (in minutes)
 */
export enum SyncInterval {
  REALTIME = 0,
  FIVE_MINUTES = 5,
  FIFTEEN_MINUTES = 15,
  THIRTY_MINUTES = 30,
  ONE_HOUR = 60,
}
