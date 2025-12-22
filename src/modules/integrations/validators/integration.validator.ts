import { z } from 'zod';
import { Platform, MessageType } from '../enums';

/**
 * Validate platform parameter
 */
export const platformSchema = z.enum([Platform.WHATSAPP, Platform.INSTAGRAM], {
  errorMap: () => ({ message: 'Platform must be whatsapp or instagram' }),
});

/**
 * Validate message type
 */
export const messageTypeSchema = z.enum([
  MessageType.TEXT,
  MessageType.IMAGE,
  MessageType.VIDEO,
  MessageType.AUDIO,
  MessageType.DOCUMENT,
  MessageType.LOCATION,
  MessageType.CONTACT,
  MessageType.STICKER,
  MessageType.TEMPLATE,
  MessageType.INTERACTIVE,
]);

/**
 * Validate connect integration request
 */
export const connectIntegrationValidator = z.object({
  businessAccountId: z
    .string()
    .min(1, 'Business account ID is required')
    .max(255, 'Business account ID is too long'),
  accessToken: z
    .string()
    .min(1, 'Access token is required'),
});

/**
 * Validate trigger sync request
 */
export const triggerSyncValidator = z.object({
  platform: platformSchema,
});

/**
 * Validate send message request
 */
export const sendMessageValidator = z.object({
  platform: platformSchema,
  recipientId: z
    .string()
    .min(1, 'Recipient ID is required')
    .max(255, 'Recipient ID is too long'),
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(4096, 'Message content is too long'),
  type: messageTypeSchema.default(MessageType.TEXT),
  metadata: z.object({
    mediaUrl: z.string().url('Invalid media URL').optional(),
    mediaCaption: z.string().max(1024, 'Caption is too long').optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationName: z.string().max(255).optional(),
    locationAddress: z.string().max(500).optional(),
  }).optional(),
  replyToMessageId: z.string().max(255).optional(),
});

/**
 * Validate integration settings update
 */
export const updateSettingsValidator = z.object({
  autoSync: z.boolean().optional(),
  syncIntervalMinutes: z.number().min(1).max(60).optional(),
  syncComments: z.boolean().optional(),
  notifyOnNewMessage: z.boolean().optional(),
  notifyOnStatusChange: z.boolean().optional(),
});

export type ConnectIntegrationInput = z.infer<typeof connectIntegrationValidator>;
export type TriggerSyncInput = z.infer<typeof triggerSyncValidator>;
export type SendMessageInput = z.infer<typeof sendMessageValidator>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsValidator>;
