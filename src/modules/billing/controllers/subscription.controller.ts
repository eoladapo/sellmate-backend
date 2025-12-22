import { Request, Response, NextFunction } from 'express';
import { SubscriptionService, BillingService } from '../services';
import {
  addPaymentMethodSchema,
  upgradeSubscriptionSchema,
  downgradeSubscriptionSchema,
  calculatePlanChangeSchema,
} from '../dto';
import { successResponse, errorResponse } from '../../../shared/utils/response.util';
import { z } from 'zod';

/**
 * Initialize payment request schema
 */
const initializePaymentSchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().url().optional(),
});

/**
 * Verify payment request schema
 */
const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
});

/**
 * Subscription controller
 * Handles subscription and billing API endpoints
 */
export class SubscriptionController {
  constructor(
    private subscriptionService: SubscriptionService,
    private billingService: BillingService
  ) { }

  /**
   * GET /api/v1/subscription
   * Get current subscription details
   */
  async getSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const summary = await this.subscriptionService.getSubscriptionSummary(userId);
      return successResponse(res, summary, 'Subscription retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/upgrade
   * Upgrade subscription plan
   */
  async upgradeSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const validation = upgradeSubscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(res, 'Invalid request data', 400, validation.error.errors);
      }

      const subscription = await this.subscriptionService.upgradeSubscription(userId, validation.data);
      return successResponse(res, subscription, 'Subscription upgraded successfully');
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/downgrade
   * Downgrade subscription plan
   */
  async downgradeSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const validation = downgradeSubscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(res, 'Invalid request data', 400, validation.error.errors);
      }

      const subscription = await this.subscriptionService.downgradeSubscription(userId, validation.data);
      return successResponse(res, subscription, 'Subscription downgrade scheduled');
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/cancel
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const subscription = await this.subscriptionService.cancelSubscription(userId);
      return successResponse(res, subscription, 'Subscription cancelled successfully');
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/reactivate
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const subscription = await this.subscriptionService.reactivateSubscription(userId);
      return successResponse(res, subscription, 'Subscription reactivated successfully');
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/subscription/payment-method
   * Add a new payment method
   */
  async addPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const validation = addPaymentMethodSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(res, 'Invalid request data', 400, validation.error.errors);
      }

      const paymentMethods = await this.subscriptionService.addPaymentMethod(userId, validation.data);
      return successResponse(res, { paymentMethods }, 'Payment method added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/subscription/payment-method/:index
   * Remove a payment method
   */
  async removePaymentMethod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const index = parseInt(req.params.index, 10);
      if (isNaN(index) || index < 0) {
        return errorResponse(res, 'Invalid payment method index', 400);
      }

      const paymentMethods = await this.subscriptionService.removePaymentMethod(userId, index);
      return successResponse(res, { paymentMethods }, 'Payment method removed successfully');
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/subscription/payment-method/:index/default
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const index = parseInt(req.params.index, 10);
      if (isNaN(index) || index < 0) {
        return errorResponse(res, 'Invalid payment method index', 400);
      }

      const paymentMethods = await this.subscriptionService.setDefaultPaymentMethod(userId, index);
      return successResponse(res, { paymentMethods }, 'Default payment method updated');
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/subscription/billing
   * Get billing cycle information
   */
  async getBillingInfo(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const billingInfo = await this.billingService.getBillingCycleInfo(userId);
      return successResponse(res, billingInfo, 'Billing information retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subscription/payments
   * Get payment history
   */
  async getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const limit = parseInt(req.query.limit as string, 10) || 10;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const payments = await this.billingService.getPaymentHistory(userId, limit, offset);
      return successResponse(res, { payments, limit, offset }, 'Payment history retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/calculate-change
   * Calculate cost of plan change
   */
  async calculatePlanChange(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const validation = calculatePlanChangeSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(res, 'Invalid request data', 400, validation.error.errors);
      }

      const calculation = await this.billingService.calculatePlanChange(
        userId,
        validation.data.plan,
        validation.data.billingCycle
      );
      return successResponse(res, calculation, 'Plan change calculated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subscription/usage
   * Get current usage statistics
   */
  async getUsage(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const subscription = await this.subscriptionService.getSubscription(userId);
      return successResponse(
        res,
        {
          currentUsage: subscription.currentUsage,
          usageLimits: subscription.usageLimits,
        },
        'Usage statistics retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/retry-payment
   * Retry failed payment
   */
  async retryPayment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const result = await this.billingService.retryFailedPayment(userId);
      if (result.success) {
        return successResponse(res, result, 'Payment processed successfully');
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/initialize-payment
   * Initialize a Paystack payment transaction
   */
  async initializePayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const validation = initializePaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(res, 'Invalid request data', 400, validation.error.errors);
      }

      const subscription = await this.subscriptionService.getSubscription(userId);
      const result = await this.billingService.initializePayment(
        userId,
        validation.data.email,
        subscription.amount,
        `SellMate ${subscription.plan} subscription`,
        validation.data.callbackUrl
      );

      return successResponse(res, result, 'Payment initialized. Redirect user to authorization URL.');
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/verify-payment
   * Verify a Paystack payment after callback
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const validation = verifyPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(res, 'Invalid request data', 400, validation.error.errors);
      }

      const result = await this.billingService.verifyPayment(validation.data.reference);

      if (result.success) {
        return successResponse(res, result, 'Payment verified successfully');
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/subscription/webhook/paystack
   * Handle Paystack webhook events
   */
  async handlePaystackWebhook(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response | void> {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      if (!this.billingService.verifyWebhookSignature(payload, signature)) {
        return errorResponse(res, 'Invalid webhook signature', 401);
      }

      const { event, data } = req.body;
      await this.billingService.handleWebhook(event, data);

      // Always return 200 to acknowledge receipt
      return res.status(200).json({ received: true });
    } catch (error) {
      // Log error but still return 200 to prevent retries
      console.error('Paystack webhook error:', error);
      return res.status(200).json({ received: true, error: 'Processing error' });
    }
  }
}
