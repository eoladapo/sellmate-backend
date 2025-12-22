import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannelType, DataRetentionPeriod, SyncInterval } from '../enums';

/**
 * Notification settings for a specific notification type
 */
export interface NotificationTypeSetting {
  enabled: boolean;
  channels: NotificationChannelType[];
}

/**
 * Notification settings with thresholds
 */
export interface ThresholdNotificationSetting extends NotificationTypeSetting {
  threshold?: number;
}

/**
 * Margin-based notification setting
 */
export interface MarginNotificationSetting extends NotificationTypeSetting {
  minMargin?: number;
}

/**
 * All notification preferences
 */
export interface NotificationPreferences {
  newMessage: NotificationTypeSetting;
  orderDetected: NotificationTypeSetting;
  orderStatusChanged: NotificationTypeSetting;
  orderExpiring: NotificationTypeSetting;
  lowInventory: ThresholdNotificationSetting;
  profitAlert: MarginNotificationSetting;
}

/**
 * Business profile settings
 */
export interface BusinessProfileSettings {
  name: string;
  contactPhone: string;
  defaultLocation: string;
  businessHours: {
    start: string;
    end: string;
  };
}

/**
 * WhatsApp integration settings
 */
export interface WhatsAppIntegrationSettings {
  autoSync: boolean;
  syncInterval: SyncInterval;
}

/**
 * Instagram integration settings
 */
export interface InstagramIntegrationSettings {
  autoSync: boolean;
  syncComments: boolean;
}

/**
 * Integration settings
 */
export interface IntegrationSettings {
  whatsapp: WhatsAppIntegrationSettings;
  instagram: InstagramIntegrationSettings;
}

/**
 * Data privacy settings
 */
export interface DataPrivacySettings {
  dataRetentionDays: DataRetentionPeriod;
  allowAnalytics: boolean;
  allowMarketing: boolean;
  allowDataSharing: boolean;
  allowAiProcessing: boolean;
}

@Entity('user_settings')
@Index(['userId'], { unique: true })
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  @Index()
  userId!: string;

  @Column({ type: 'jsonb' })
  notifications!: NotificationPreferences;

  @Column({ type: 'jsonb', name: 'business_profile' })
  businessProfile!: BusinessProfileSettings;

  @Column({ type: 'jsonb' })
  integrations!: IntegrationSettings;

  @Column({ type: 'jsonb', name: 'data_privacy' })
  dataPrivacy!: DataPrivacySettings;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  constructor() {
    // Default notification preferences
    this.notifications = {
      newMessage: {
        enabled: true,
        channels: [NotificationChannelType.IN_APP, NotificationChannelType.PUSH],
      },
      orderDetected: {
        enabled: true,
        channels: [NotificationChannelType.IN_APP, NotificationChannelType.PUSH],
      },
      orderStatusChanged: {
        enabled: true,
        channels: [NotificationChannelType.IN_APP],
      },
      orderExpiring: {
        enabled: true,
        channels: [NotificationChannelType.IN_APP, NotificationChannelType.PUSH],
      },
      lowInventory: {
        enabled: false,
        channels: [NotificationChannelType.IN_APP],
        threshold: 10,
      },
      profitAlert: {
        enabled: false,
        channels: [NotificationChannelType.IN_APP],
        minMargin: 20,
      },
    };

    // Default business profile
    this.businessProfile = {
      name: '',
      contactPhone: '',
      defaultLocation: '',
      businessHours: {
        start: '09:00',
        end: '18:00',
      },
    };

    // Default integration settings
    this.integrations = {
      whatsapp: {
        autoSync: true,
        syncInterval: SyncInterval.REALTIME,
      },
      instagram: {
        autoSync: true,
        syncComments: false,
      },
    };

    // Default data privacy settings
    this.dataPrivacy = {
      dataRetentionDays: DataRetentionPeriod.ONE_YEAR,
      allowAnalytics: true,
      allowMarketing: false,
      allowDataSharing: false,
      allowAiProcessing: true,
    };
  }
}
