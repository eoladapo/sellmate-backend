import { Router } from 'express';
import { Container } from 'typedi';
import { SubscriptionController } from '../../../modules/billing/controllers';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

/**
 * Get subscription controller from DI container
 */
const getController = (): SubscriptionController => {
  return Container.get<SubscriptionController>('SubscriptionController');
};

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription and billing management
 */

/**
 * @swagger
 * /api/v1/subscription:
 *   get:
 *     summary: Get current subscription details
 *     description: Returns the user's current subscription plan, status, and features
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
 *                   $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, (req, res, next) => {
  return getController().getSubscription(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/usage:
 *   get:
 *     summary: Get current usage statistics
 *     description: Returns usage metrics against plan limits
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
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
 *                     orders:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                     conversations:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                     aiRequests:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/usage', authMiddleware, (req, res, next) => {
  return getController().getUsage(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/billing:
 *   get:
 *     summary: Get billing cycle information
 *     description: Returns current billing cycle details and next billing date
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing information retrieved successfully
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
 *                     currentPeriodStart:
 *                       type: string
 *                       format: date-time
 *                     currentPeriodEnd:
 *                       type: string
 *                       format: date-time
 *                     nextBillingDate:
 *                       type: string
 *                       format: date-time
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/billing', authMiddleware, (req, res, next) => {
  return getController().getBillingInfo(req, res, next);
});


/**
 * @swagger
 * /api/v1/subscription/payments:
 *   get:
 *     summary: Get payment history
 *     description: Returns list of past payments and invoices
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [successful, failed, pending, refunded]
 *                       paidAt:
 *                         type: string
 *                         format: date-time
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/payments', authMiddleware, (req, res, next) => {
  return getController().getPaymentHistory(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/upgrade:
 *   post:
 *     summary: Upgrade subscription plan
 *     description: Upgrades the user's subscription to a higher tier plan
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
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [starter, professional, business]
 *                 description: Target plan to upgrade to
 *     responses:
 *       200:
 *         description: Subscription upgraded successfully
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
 *         description: Invalid plan or cannot upgrade
 *       401:
 *         description: Unauthorized
 */
router.post('/upgrade', authMiddleware, (req, res, next) => {
  return getController().upgradeSubscription(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/downgrade:
 *   post:
 *     summary: Downgrade subscription plan
 *     description: Downgrades the user's subscription to a lower tier plan (effective at end of billing cycle)
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
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [starter, professional, business]
 *                 description: Target plan to downgrade to
 *     responses:
 *       200:
 *         description: Downgrade scheduled successfully
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
 *                   type: object
 *                   properties:
 *                     effectiveDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid plan or cannot downgrade
 *       401:
 *         description: Unauthorized
 */
router.post('/downgrade', authMiddleware, (req, res, next) => {
  return getController().downgradeSubscription(req, res, next);
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional cancellation reason
 *               feedback:
 *                 type: string
 *                 description: Optional feedback
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
 *                   type: object
 *                   properties:
 *                     cancelledAt:
 *                       type: string
 *                       format: date-time
 *                     accessEndsAt:
 *                       type: string
 *                       format: date-time
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
 *     description: Reactivates a cancelled subscription before the access period ends
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
 *         description: Subscription cannot be reactivated
 *       401:
 *         description: Unauthorized
 */
router.post('/reactivate', authMiddleware, (req, res, next) => {
  return getController().reactivateSubscription(req, res, next);
});


/**
 * @swagger
 * /api/v1/subscription/payment-method:
 *   put:
 *     summary: Add a new payment method
 *     description: Adds a new payment method to the user's account
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
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [card, bank_transfer]
 *               cardNumber:
 *                 type: string
 *                 description: Card number (for card type)
 *               expiryMonth:
 *                 type: string
 *               expiryYear:
 *                 type: string
 *               cvv:
 *                 type: string
 *               bankCode:
 *                 type: string
 *                 description: Bank code (for bank_transfer type)
 *               accountNumber:
 *                 type: string
 *                 description: Account number (for bank_transfer type)
 *               setAsDefault:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *       400:
 *         description: Invalid payment method details
 *       401:
 *         description: Unauthorized
 */
router.put('/payment-method', authMiddleware, (req, res, next) => {
  return getController().addPaymentMethod(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/payment-method/{index}:
 *   delete:
 *     summary: Remove a payment method
 *     description: Removes a payment method from the user's account
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index of the payment method to remove
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 *       400:
 *         description: Cannot remove default payment method
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
router.delete('/payment-method/:index', authMiddleware, (req, res, next) => {
  return getController().removePaymentMethod(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/payment-method/{index}/default:
 *   put:
 *     summary: Set a payment method as default
 *     description: Sets the specified payment method as the default for billing
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index of the payment method to set as default
 *     responses:
 *       200:
 *         description: Default payment method updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
router.put('/payment-method/:index/default', authMiddleware, (req, res, next) => {
  return getController().setDefaultPaymentMethod(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/calculate-change:
 *   post:
 *     summary: Calculate cost of plan change
 *     description: Calculates prorated costs for upgrading or downgrading plans
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
 *               - targetPlanId
 *             properties:
 *               targetPlanId:
 *                 type: string
 *                 enum: [starter, professional, business]
 *     responses:
 *       200:
 *         description: Cost calculation completed
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
 *                     currentPlan:
 *                       type: string
 *                     targetPlan:
 *                       type: string
 *                     proratedCredit:
 *                       type: number
 *                     amountDue:
 *                       type: number
 *                     effectiveDate:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.post('/calculate-change', authMiddleware, (req, res, next) => {
  return getController().calculatePlanChange(req, res, next);
});

/**
 * @swagger
 * /api/v1/subscription/retry-payment:
 *   post:
 *     summary: Retry failed payment
 *     description: Retries a failed payment for the current billing cycle
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment retry initiated
 *       400:
 *         description: No failed payment to retry
 *       401:
 *         description: Unauthorized
 */
router.post('/retry-payment', authMiddleware, (req, res, next) => {
  return getController().retryPayment(req, res, next);
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
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [starter, professional, business]
 *               callbackUrl:
 *                 type: string
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
 *     security:
 *       - bearerAuth: []
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
 *                     status:
 *                       type: string
 *                       enum: [success, failed, pending]
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Invalid reference or payment failed
 *       401:
 *         description: Unauthorized
 */
router.post('/verify-payment', authMiddleware, (req, res, next) => {
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
 *       400:
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
 *         planId:
 *           type: string
 *           enum: [starter, professional, business]
 *         status:
 *           type: string
 *           enum: [active, cancelled, past_due, trialing, expired]
 *         currentPeriodStart:
 *           type: string
 *           format: date-time
 *         currentPeriodEnd:
 *           type: string
 *           format: date-time
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *         features:
 *           type: object
 *           properties:
 *             maxOrders:
 *               type: integer
 *             maxConversations:
 *               type: integer
 *             maxAiRequests:
 *               type: integer
 *             analyticsAccess:
 *               type: boolean
 *             prioritySupport:
 *               type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default router;
