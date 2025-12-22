import { z } from 'zod';
import { NotificationType, NotificationStatus } from '../enums';

export const GetNotificationsQuerySchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
  isRead: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  status: z.nativeEnum(NotificationStatus).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type GetNotificationsQuery = z.infer<typeof GetNotificationsQuerySchema>;
