import { z } from 'zod';
import {
  SubscriptionPlan,
  BillingCycle,
} from '../enums';

/**
 * Change plan request schema
 * Used for both upgrades and downgrades - the service determines which based on plan comparison
 * Requirements: 2.1, 2.2
 */
export const changePlanSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
});

export type ChangePlanDto = z.infer<typeof changePlanSchema>;

/**
 * Initialize payment request schema
 */
export const initializePaymentSchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().url().optional(),
});

export type InitializePaymentDto = z.infer<typeof initializePaymentSchema>;

/**
 * Verify payment request schema
 */
export const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
});

export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;
