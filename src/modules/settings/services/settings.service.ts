import {
  UserSettings,
  NotificationPreferences,
  BusinessProfileSettings,
  IntegrationSettings,
  DataPrivacySettings,
  NotificationTypeSetting,
  ThresholdNotificationSetting,
  MarginNotificationSetting,
} from '../entities';
import { SettingsRepository } from '../repositories';
import {
  ISettingsService,
  UpdateSettingsRequest,
  UpdateNotificationPreferencesRequest,
  UpdateBusinessProfileRequest,
  UpdateIntegrationSettingsRequest,
  UpdateDataPrivacyRequest,
} from '../interfaces';
import { NotificationChannelType, DataRetentionPeriod, SyncInterval } from '../enums';

/**
 * Settings service implementation
 */
export class SettingsService implements ISettingsService {
  constructor(private settingsRepository: SettingsRepository) { }

  async getSettings(userId: string): Promise<UserSettings> {
    return this.settingsRepository.getOrCreate(userId);
  }

  async updateSettings(userId: string, data: UpdateSettingsRequest): Promise<UserSettings> {
    const settings = await this.settingsRepository.getOrCreate(userId);

    // Update each section if provided
    if (data.notifications) {
      settings.notifications = this.mergeNotificationPreferences(
        settings.notifications,
        data.notifications
      );
    }

    if (data.businessProfile) {
      settings.businessProfile = this.mergeBusinessProfile(
        settings.businessProfile,
        data.businessProfile
      );
    }

    if (data.integrations) {
      settings.integrations = this.mergeIntegrationSettings(
        settings.integrations,
        data.integrations
      );
    }

    if (data.dataPrivacy) {
      settings.dataPrivacy = this.mergeDataPrivacySettings(
        settings.dataPrivacy,
        data.dataPrivacy
      );
    }

    return this.settingsRepository.update(userId, settings);
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    return settings.notifications;
  }

  async updateNotificationPreferences(
    userId: string,
    data: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    settings.notifications = this.mergeNotificationPreferences(settings.notifications, data);
    await this.settingsRepository.update(userId, { notifications: settings.notifications });
    return settings.notifications;
  }

  async getBusinessProfile(userId: string): Promise<BusinessProfileSettings> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    return settings.businessProfile;
  }

  async updateBusinessProfile(
    userId: string,
    data: UpdateBusinessProfileRequest
  ): Promise<BusinessProfileSettings> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    settings.businessProfile = this.mergeBusinessProfile(settings.businessProfile, data);
    await this.settingsRepository.update(userId, { businessProfile: settings.businessProfile });
    return settings.businessProfile;
  }

  async getIntegrationSettings(userId: string): Promise<IntegrationSettings> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    return settings.integrations;
  }

  async updateIntegrationSettings(
    userId: string,
    data: UpdateIntegrationSettingsRequest
  ): Promise<IntegrationSettings> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    settings.integrations = this.mergeIntegrationSettings(settings.integrations, data);
    await this.settingsRepository.update(userId, { integrations: settings.integrations });
    return settings.integrations;
  }

  async getDataPrivacySettings(userId: string): Promise<DataPrivacySettings> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    return settings.dataPrivacy;
  }

  async updateDataPrivacySettings(
    userId: string,
    data: UpdateDataPrivacyRequest
  ): Promise<DataPrivacySettings> {
    const settings = await this.settingsRepository.getOrCreate(userId);
    settings.dataPrivacy = this.mergeDataPrivacySettings(settings.dataPrivacy, data);
    await this.settingsRepository.update(userId, { dataPrivacy: settings.dataPrivacy });
    return settings.dataPrivacy;
  }

  async initializeSettings(userId: string, businessName?: string): Promise<UserSettings> {
    const existing = await this.settingsRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const settings = new UserSettings();
    settings.userId = userId;

    if (businessName) {
      settings.businessProfile.name = businessName;
    }

    return this.settingsRepository.create(userId, settings);
  }

  async deleteSettings(userId: string): Promise<boolean> {
    return this.settingsRepository.delete(userId);
  }

  // ============================================
  // Private helper methods for merging settings
  // ============================================

  private mergeNotificationPreferences(
    existing: NotificationPreferences,
    updates: UpdateNotificationPreferencesRequest
  ): NotificationPreferences {
    const result = { ...existing };

    if (updates.newMessage) {
      result.newMessage = this.mergeNotificationTypeSetting(
        result.newMessage,
        updates.newMessage
      );
    }

    if (updates.orderDetected) {
      result.orderDetected = this.mergeNotificationTypeSetting(
        result.orderDetected,
        updates.orderDetected
      );
    }

    if (updates.orderStatusChanged) {
      result.orderStatusChanged = this.mergeNotificationTypeSetting(
        result.orderStatusChanged,
        updates.orderStatusChanged
      );
    }

    if (updates.orderExpiring) {
      result.orderExpiring = this.mergeNotificationTypeSetting(
        result.orderExpiring,
        updates.orderExpiring
      );
    }

    if (updates.lowInventory) {
      result.lowInventory = this.mergeThresholdNotificationSetting(
        result.lowInventory,
        updates.lowInventory
      );
    }

    if (updates.profitAlert) {
      result.profitAlert = this.mergeMarginNotificationSetting(
        result.profitAlert,
        updates.profitAlert
      );
    }

    return result;
  }

  private mergeNotificationTypeSetting(
    existing: NotificationTypeSetting,
    updates: { enabled?: boolean; channels?: string[] }
  ): NotificationTypeSetting {
    return {
      enabled: updates.enabled !== undefined ? updates.enabled : existing.enabled,
      channels: updates.channels
        ? this.validateChannels(updates.channels)
        : existing.channels,
    };
  }

  private mergeThresholdNotificationSetting(
    existing: ThresholdNotificationSetting,
    updates: { enabled?: boolean; channels?: string[]; threshold?: number }
  ): ThresholdNotificationSetting {
    return {
      enabled: updates.enabled !== undefined ? updates.enabled : existing.enabled,
      channels: updates.channels
        ? this.validateChannels(updates.channels)
        : existing.channels,
      threshold: updates.threshold !== undefined ? updates.threshold : existing.threshold,
    };
  }

  private mergeMarginNotificationSetting(
    existing: MarginNotificationSetting,
    updates: { enabled?: boolean; channels?: string[]; minMargin?: number }
  ): MarginNotificationSetting {
    return {
      enabled: updates.enabled !== undefined ? updates.enabled : existing.enabled,
      channels: updates.channels
        ? this.validateChannels(updates.channels)
        : existing.channels,
      minMargin: updates.minMargin !== undefined ? updates.minMargin : existing.minMargin,
    };
  }

  private validateChannels(channels: string[]): NotificationChannelType[] {
    const validChannels = Object.values(NotificationChannelType);
    return channels.filter((c) =>
      validChannels.includes(c as NotificationChannelType)
    ) as NotificationChannelType[];
  }

  private mergeBusinessProfile(
    existing: BusinessProfileSettings,
    updates: UpdateBusinessProfileRequest
  ): BusinessProfileSettings {
    return {
      name: updates.name !== undefined ? updates.name : existing.name,
      contactPhone: updates.contactPhone !== undefined ? updates.contactPhone : existing.contactPhone,
      defaultLocation: updates.defaultLocation !== undefined ? updates.defaultLocation : existing.defaultLocation,
      businessHours: {
        start: updates.businessHours?.start !== undefined
          ? updates.businessHours.start
          : existing.businessHours.start,
        end: updates.businessHours?.end !== undefined
          ? updates.businessHours.end
          : existing.businessHours.end,
      },
    };
  }

  private mergeIntegrationSettings(
    existing: IntegrationSettings,
    updates: UpdateIntegrationSettingsRequest
  ): IntegrationSettings {
    return {
      whatsapp: {
        autoSync: updates.whatsapp?.autoSync !== undefined
          ? updates.whatsapp.autoSync
          : existing.whatsapp.autoSync,
        syncInterval: updates.whatsapp?.syncInterval !== undefined
          ? this.validateSyncInterval(updates.whatsapp.syncInterval)
          : existing.whatsapp.syncInterval,
      },
      instagram: {
        autoSync: updates.instagram?.autoSync !== undefined
          ? updates.instagram.autoSync
          : existing.instagram.autoSync,
        syncComments: updates.instagram?.syncComments !== undefined
          ? updates.instagram.syncComments
          : existing.instagram.syncComments,
      },
    };
  }

  private validateSyncInterval(interval: number): SyncInterval {
    const validIntervals = Object.values(SyncInterval).filter(
      (v) => typeof v === 'number'
    ) as number[];
    return validIntervals.includes(interval) ? interval : SyncInterval.REALTIME;
  }

  private mergeDataPrivacySettings(
    existing: DataPrivacySettings,
    updates: UpdateDataPrivacyRequest
  ): DataPrivacySettings {
    return {
      dataRetentionDays: updates.dataRetentionDays !== undefined
        ? this.validateRetentionPeriod(updates.dataRetentionDays)
        : existing.dataRetentionDays,
      allowAnalytics: updates.allowAnalytics !== undefined
        ? updates.allowAnalytics
        : existing.allowAnalytics,
      allowMarketing: updates.allowMarketing !== undefined
        ? updates.allowMarketing
        : existing.allowMarketing,
      allowDataSharing: updates.allowDataSharing !== undefined
        ? updates.allowDataSharing
        : existing.allowDataSharing,
      allowAiProcessing: updates.allowAiProcessing !== undefined
        ? updates.allowAiProcessing
        : existing.allowAiProcessing,
    };
  }

  private validateRetentionPeriod(days: number): DataRetentionPeriod {
    const validPeriods = Object.values(DataRetentionPeriod).filter(
      (v) => typeof v === 'number'
    ) as number[];
    return validPeriods.includes(days) ? days : DataRetentionPeriod.ONE_YEAR;
  }
}
