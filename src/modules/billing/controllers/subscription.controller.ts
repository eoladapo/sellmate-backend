import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TOKENS } from '../../../di/tokens';
import { SubscriptionService } from '../services';
import { changePlanSchema, initializePaymentSchema, verifyPaymentSchema } from '../dto';
import { successResponse, errorResponse } from '../../../shared/utils/response.util';

/**
 * Simplified subscription controller for MVP
 * - Removed usage tracking endpoints (deferred to post-MVP)
 * - Removed payment method management endpoints (Paystack handles card storage)
 * - Consolidated upgrade/downgrade into single changePlan endpoint
 * - Removed billing info, payment history, calculate change, retry payment endpoints
 * - All Paystack operations now handled through SubscriptionService
 */
@injectable()
export class SubscriptionController {
  constructor(
    @inject(TOKENS.SubscriptionService) private subscriptionService: SubscriptionService
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
   * POST /api/v1/subscription/change-plan
   * Change subscription plan (handles both upgrades and downgrades)
   * - Upgrades take effect immediately
   * - Downgrades are scheduled for end of current billing period
   */
  async changePlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const validation = changePlanSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(res, 'Invalid request data', 400, validation.error.errors);
      }

      const subscription = await this.subscriptionService.changePlan(userId, validation.data);
      return successResponse(res, subscription, 'Plan changed successfully');
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
      const result = await this.subscriptionService.initializePayment(
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

      const result = await this.subscriptionService.verifyPayment(validation.data.reference);

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
      if (!this.subscriptionService.verifyWebhookSignature(payload, signature)) {
        return errorResponse(res, 'Invalid webhook signature', 401);
      }

      const { event, data } = req.body;
      await this.subscriptionService.handleWebhook(event, data);

      // Always return 200 to acknowledge receipt
      return res.status(200).json({ received: true });
    } catch (error) {
      // Log error but still return 200 to prevent retries
      console.error('Paystack webhook error:', error);
      return res.status(200).json({ received: true, error: 'Processing error' });
    }
  }
}
