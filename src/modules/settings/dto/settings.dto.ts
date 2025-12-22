import { z } from 'zod';

/**
 * Notification channel validation
 */
const notificationChannelSchema = z.enum(['email', 'push', 'sms', 'in_app']);

/**
 * Base notification type setting schema
 */
const notificationTypeSettingSchema = z.object({
  enabled: z.boolean().optional(),
  channels: z.array(notificationChannelSchema).optional(),
});

/**
 * Threshold notification setting schema
 */
const thresholdNotificationSettingSchema = notificationTypeSettingSchema.extend({
  threshold: z.number().min(0).optional(),
});

/**
 * Margin notification setting schema
 */
const marginNotificationSettingSchema = notificationTypeSettingSchema.extend({
  minMargin: z.number().min(0).max(100).optional(),
});

/**
 * Update notification preferences schema
 */
export const updateNotificationPreferencesSchema = z.object({
  newMessage: notificationTypeSettingSchema.optional(),
  orderDetected: notificationTypeSettingSchema.optional(),
  orderStatusChanged: notificationTypeSettingSchema.optional(),
  orderExpiring: notificationTypeSettingSchema.optional(),
  lowInventory: thresholdNotificationSettingSchema.optional(),
  profitAlert: marginNotificationSettingSchema.optional(),
});

/**
 * Business hours schema
 */
const businessHoursSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
});

/**
 * Update business profile schema
 */
export const updateBusinessProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  contactPhone: z.string().min(10).max(20).optional(),
  defaultLocation: z.string().max(500).optional(),
  businessHours: businessHoursSchema.optional(),
});

/**
 * WhatsApp integration settings schema
 */
const whatsappIntegrationSchema = z.object({
  autoSync: z.boolean().optional(),
  syncInterval: z.number().min(0).max(60).optional(),
});

/**
 * Instagram integration settings schema
 */
const instagramIntegrationSchema = z.object({
  autoSync: z.boolean().optional(),
  syncComments: z.boolean().optional(),
});

/**
 * Update integration settings schema
 */
export const updateIntegrationSettingsSchema = z.object({
  whatsapp: whatsappIntegrationSchema.optional(),
  instagram: instagramIntegrationSchema.optional(),
});

/**
 * Update data privacy settings schema
 */
export const updateDataPrivacySchema = z.object({
  dataRetentionDays: z.number().optional(),
  allowAnalytics: z.boolean().optional(),
  allowMarketing: z.boolean().optional(),
  allowDataSharing: z.boolean().optional(),
  allowAiProcessing: z.boolean().optional(),
});

/**
 * Update all settings schema
 */
export const updateSettingsSchema = z.object({
  notifications: updateNotificationPreferencesSchema.optional(),
  businessProfile: updateBusinessProfileSchema.optional(),
  integrations: updateIntegrationSettingsSchema.optional(),
  dataPrivacy: updateDataPrivacySchema.optional(),
});

// Type exports
export type UpdateNotificationPreferencesDto = z.infer<typeof updateNotificationPreferencesSchema>;
export type UpdateBusinessProfileDto = z.infer<typeof updateBusinessProfileSchema>;
export type UpdateIntegrationSettingsDto = z.infer<typeof updateIntegrationSettingsSchema>;
export type UpdateDataPrivacyDto = z.infer<typeof updateDataPrivacySchema>;
export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
