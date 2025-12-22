import { Router } from 'express';
import { SubscriptionController } from '../../../modules/billing/controllers';
import { authMiddleware } from '../../middleware/auth.middleware';
import { container, TOKENS } from '../../../di';

const router = Router();

/**
 * Get subscription controller from DI container
 */
const getController = (): SubscriptionController => {
  return container.resolve<SubscriptionController>(TOKENS.SubscriptionController);
};

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
 *     description: Returns the user's current subscription plan, status, and billing info
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionSummary'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, (req, res, next) => {
  return getController().getSubscription(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/change-plan:
 *   post:
 *     summary: Change subscription plan
 *     description: Changes the user's subscription plan. Upgrades take effect immediately, downgrades are scheduled for end of billing period.
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [starter, professional, business]
 *                 description: Target plan
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: Optional billing cycle change
 *     responses:
 *       200:
 *         description: Plan changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Invalid plan or cannot change to same plan
 *       401:
 *         description: Unauthorized
 */
router.post('/change-plan', authMiddleware, (req, res, next) => {
  return getController().changePlan(req, res, next);
});


/**
 * @swagger
 * /api/v1/subscription/cancel:
 *   post:
 *     summary: Cancel subscription
 *     description: Cancels the subscription (access continues until end of billing period)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Subscription already cancelled
 *       401:
 *         description: Unauthorized
 */
router.post('/cancel', authMiddleware, (req, res, next) => {
  return getController().cancelSubscription(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/reactivate:
 *   post:
 *     summary: Reactivate cancelled subscription
 *     description: Reactivates a cancelled subscription with a new payment
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Only cancelled subscriptions can be reactivated
 *       401:
 *         description: Unauthorized
 */
router.post('/reactivate', authMiddleware, (req, res, next) => {
  return getController().reactivateSubscription(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/initialize-payment:
 *   post:
 *     summary: Initialize a Paystack payment transaction
 *     description: Creates a new payment transaction with Paystack
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email for payment
 *               callbackUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect after payment
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorizationUrl:
 *                       type: string
 *                       description: URL to redirect user for payment
 *                     accessCode:
 *                       type: string
 *                     reference:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/initialize-payment', authMiddleware, (req, res, next) => {
  return getController().initializePayment(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/verify-payment:
 *   post:
 *     summary: Verify a Paystack payment after callback
 *     description: Verifies the payment status after user returns from Paystack
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference
 *             properties:
 *               reference:
 *                 type: string
 *                 description: Payment reference from Paystack
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid reference or payment failed
 */
router.post('/verify-payment', (req, res, next) => {
  return getController().verifyPayment(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/webhook/paystack:
 *   post:
 *     summary: Handle Paystack webhook events
 *     description: Receives and processes webhook events from Paystack
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook signature
 */
router.post('/webhook/paystack', (req, res, next) => {
  return getController().handlePaystackWebhook(req, res, next);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         plan:
 *           type: string
 *           enum: [starter, professional, business]
 *         status:
 *           type: string
 *           enum: [trial, active, cancelled, past_due]
 *         billingCycle:
 *           type: string
 *           enum: [monthly, yearly]
 *         currentPeriodStart:
 *           type: string
 *           format: date-time
 *         currentPeriodEnd:
 *           type: string
 *           format: date-time
 *         trialEnd:
 *           type: string
 *           format: date-time
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         nextPaymentDate:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SubscriptionSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         plan:
 *           type: string
 *           enum: [starter, professional, business]
 *         status:
 *           type: string
 *           enum: [trial, active, cancelled, past_due]
 *         billingCycle:
 *           type: string
 *           enum: [monthly, yearly]
 *         currentPeriodStart:
 *           type: string
 *           format: date-time
 *         currentPeriodEnd:
 *           type: string
 *           format: date-time
 *         trialEnd:
 *           type: string
 *           format: date-time
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         nextPaymentDate:
 *           type: string
 *           format: date-time
 *         daysUntilRenewal:
 *           type: integer
 *         isTrialActive:
 *           type: boolean
 *         canUpgrade:
 *           type: boolean
 *         canDowngrade:
 *           type: boolean
 */

export default router;
