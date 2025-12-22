import { Router } from 'express';
import { SubscriptionController } from '../../../modules/billing/controllers';
import { authMiddleware } from '../../middleware/auth.middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management (simplified for MVP)
 */

/**
 * @swagger
 * /api/v1/subscription:
 *   get:
 *     summary: Get current subscription details
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 */
router.get('/', authMiddleware, bind<SubscriptionController>(TOKENS.SubscriptionController, 'getSubscription'));

/**
 * @swagger
 * /api/v1/subscription/change-plan:
 *   post:
 *     summary: Change subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plan changed successfully
 */
router.post('/change-plan', authMiddleware, bind<SubscriptionController>(TOKENS.SubscriptionController, 'changePlan'));

/**
 * @swagger
 * /api/v1/subscription/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 */
router.post('/cancel', authMiddleware, bind<SubscriptionController>(TOKENS.SubscriptionController, 'cancelSubscription'));

/**
 * @swagger
 * /api/v1/subscription/reactivate:
 *   post:
 *     summary: Reactivate cancelled subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription reactivated successfully
 */
router.post('/reactivate', authMiddleware, bind<SubscriptionController>(TOKENS.SubscriptionController, 'reactivateSubscription'));

/**
 * @swagger
 * /api/v1/subscription/initialize-payment:
 *   post:
 *     summary: Initialize a Paystack payment transaction
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 */
router.post('/initialize-payment', authMiddleware, bind<SubscriptionController>(TOKENS.SubscriptionController, 'initializePayment'));

/**
 * @swagger
 * /api/v1/subscription/verify-payment:
 *   post:
 *     summary: Verify a Paystack payment after callback
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post('/verify-payment', bind<SubscriptionController>(TOKENS.SubscriptionController, 'verifyPayment'));

/**
 * @swagger
 * /api/v1/subscription/webhook/paystack:
 *   post:
 *     summary: Handle Paystack webhook events
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook/paystack', bind<SubscriptionController>(TOKENS.SubscriptionController, 'handlePaystackWebhook'));

export default router;
