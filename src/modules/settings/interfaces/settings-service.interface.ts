import {
  UserSettings,
  NotificationPreferences,
  BusinessProfileSettings,
  IntegrationSettings,
  DataPrivacySettings,
} from '../entities';

/**
 * Update notification preferences request
 */
export interface UpdateNotificationPreferencesRequest {
  newMessage?: {
    enabled?: boolean;
    channels?: string[];
  };
  orderDetected?: {
    enabled?: boolean;
    channels?: string[];
  };
  orderStatusChanged?: {
    enabled?: boolean;
    channels?: string[];
  };
  orderExpiring?: {
    enabled?: boolean;
    channels?: string[];
  };
  lowInventory?: {
    enabled?: boolean;
    channels?: string[];
    threshold?: number;
  };
  profitAlert?: {
    enabled?: boolean;
    channels?: string[];
    minMargin?: number;
  };
}

/**
 * Update business profile request
 */
export interface UpdateBusinessProfileRequest {
  name?: string;
  contactPhone?: string;
  defaultLocation?: string;
  businessHours?: {
    start?: string;
    end?: string;
  };
}

/**
 * Update integration settings request
 */
export interface UpdateIntegrationSettingsRequest {
  whatsapp?: {
    autoSync?: boolean;
    syncInterval?: number;
  };
  instagram?: {
    autoSync?: boolean;
    syncComments?: boolean;
  };
}

/**
 * Update data privacy settings request
 */
export interface UpdateDataPrivacyRequest {
  dataRetentionDays?: number;
  allowAnalytics?: boolean;
  allowMarketing?: boolean;
  allowDataSharing?: boolean;
  allowAiProcessing?: boolean;
}

/**
 * Update all settings request
 */
export interface UpdateSettingsRequest {
  notifications?: UpdateNotificationPreferencesRequest;
  businessProfile?: UpdateBusinessProfileRequest;
  integrations?: UpdateIntegrationSettingsRequest;
  dataPrivacy?: UpdateDataPrivacyRequest;
}

/**
 * Settings service interface
 */
export interface ISettingsService {
  /**
   * Get all settings for a user
   */
  getSettings(userId: string): Promise<UserSettings>;

  /**
   * Update all settings
   */
  updateSettings(userId: string, data: UpdateSettingsRequest): Promise<UserSettings>;

  /**
   * Get notification preferences
   */
  getNotificationPreferences(userId: string): Promise<NotificationPreferences>;

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(
    userId: string,
    data: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences>;

  /**
   * Get business profile settings
   */
  getBusinessProfile(userId: string): Promise<BusinessProfileSettings>;

  /**
   * Update business profile settings
   */
  updateBusinessProfile(
    userId: string,
    data: UpdateBusinessProfileRequest
  ): Promise<BusinessProfileSettings>;

  /**
   * Get integration settings
   */
  getIntegrationSettings(userId: string): Promise<IntegrationSettings>;

  /**
   * Update integration settings
   */
  updateIntegrationSettings(
    userId: string,
    data: UpdateIntegrationSettingsRequest
  ): Promise<IntegrationSettings>;

  /**
   * Get data privacy settings
   */
  getDataPrivacySettings(userId: string): Promise<DataPrivacySettings>;

  /**
   * Update data privacy settings
   */
  updateDataPrivacySettings(
    userId: string,
    data: UpdateDataPrivacyRequest
  ): Promise<DataPrivacySettings>;

  /**
   * Initialize default settings for a new user
   */
  initializeSettings(userId: string, businessName?: string): Promise<UserSettings>;

  /**
   * Delete all settings for a user
   */
  deleteSettings(userId: string): Promise<boolean>;
}
