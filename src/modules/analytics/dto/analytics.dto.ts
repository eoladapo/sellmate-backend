import { z } from 'zod';
import { ReportFormat } from '../enums';

export const DateRangeQuerySchema = z.object({
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
});

export const ExportQuerySchema = z.object({
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  format: z.nativeEnum(ReportFormat).optional().default(ReportFormat.JSON),
  includeOrders: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  includeCustomers: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  includeProfit: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type ExportQuery = z.infer<typeof ExportQuerySchema>;
