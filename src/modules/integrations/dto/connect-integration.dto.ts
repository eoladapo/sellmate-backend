import { z } from 'zod';

/**
 * Schema for connecting an integration
 */
export const connectIntegrationSchema = z.object({
  businessAccountId: z.string().min(1, 'Business account ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
});

export type ConnectIntegrationDto = z.infer<typeof connectIntegrationSchema>;

/**
 * Schema for triggering sync
 */
export const triggerSyncSchema = z.object({
  platform: z.enum(['whatsapp', 'instagram'], {
    errorMap: () => ({ message: 'Platform must be whatsapp or instagram' }),
  }),
});

export type TriggerSyncDto = z.infer<typeof triggerSyncSchema>;

/**
 * Schema for sending a message
 */
export const sendMessageSchema = z.object({
  platform: z.enum(['whatsapp', 'instagram']),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Message content is required'),
  type: z.enum(['text', 'image', 'video', 'audio', 'document', 'location']).default('text'),
  metadata: z.object({
    mediaUrl: z.string().url().optional(),
    mediaCaption: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    locationName: z.string().optional(),
    locationAddress: z.string().optional(),
  }).optional(),
  replyToMessageId: z.string().optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
