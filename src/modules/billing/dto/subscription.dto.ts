import { z } from 'zod';
import {
  SubscriptionPlan,
  BillingCycle,
  PaymentMethodType,
} from '../enums';

/**
 * Add payment method request schema
 */
export const addPaymentMethodSchema = z.object({
  type: z.nativeEnum(PaymentMethodType),
  last4: z.string().length(4).optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(2024).max(2050).optional(),
  bankName: z.string().max(100).optional(),
  accountLast4: z.string().length(4).optional(),
  mobileNumber: z.string().max(20).optional(),
  provider: z.string().max(50).optional(),
  setAsDefault: z.boolean().optional(),
});

export type AddPaymentMethodDto = z.infer<typeof addPaymentMethodSchema>;

/**
 * Upgrade subscription request schema
 */
export const upgradeSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
});

export type UpgradeSubscriptionDto = z.infer<typeof upgradeSubscriptionSchema>;

/**
 * Downgrade subscription request schema
 */
export const downgradeSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
});

export type DowngradeSubscriptionDto = z.infer<typeof downgradeSubscriptionSchema>;

/**
 * Set default payment method request schema
 */
export const setDefaultPaymentMethodSchema = z.object({
  index: z.number().min(0),
});

export type SetDefaultPaymentMethodDto = z.infer<typeof setDefaultPaymentMethodSchema>;

/**
 * Remove payment method request schema
 */
export const removePaymentMethodSchema = z.object({
  index: z.number().min(0),
});

export type RemovePaymentMethodDto = z.infer<typeof removePaymentMethodSchema>;

/**
 * Calculate plan change request schema
 */
export const calculatePlanChangeSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
});

export type CalculatePlanChangeDto = z.infer<typeof calculatePlanChangeSchema>;
