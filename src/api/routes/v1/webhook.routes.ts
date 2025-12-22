import { Router } from 'express';
import { WebhookController } from '../../../modules/integrations/controllers/webhook.controller';

/**
 * Webhook routes for WhatsApp and Instagram
 * These routes handle incoming webhooks from Meta platforms
 */
const router = Router();
const webhookController = new WebhookController();

/**
 * WhatsApp Webhook Routes
 */

/**
 * @swagger
 * /api/v1/webhooks/whatsapp:
 *   get:
 *     summary: WhatsApp webhook verification
 *     description: |
 *       Meta sends a GET request to verify the webhook URL during setup.
 *       This endpoint validates the verify token and returns the challenge.
 *     tags: [Webhooks]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *         required: true
 *         description: Should be "subscribe"
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *         required: true
 *         description: The verify token configured in Meta App settings
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *         required: true
 *         description: Challenge string to return if verification succeeds
 *     responses:
 *       200:
 *         description: Verification successful, returns the challenge
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       403:
 *         description: Verification failed - invalid verify token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get(
  '/whatsapp',
  webhookController.verifyWhatsAppWebhook.bind(webhookController)
);

/**
 * @swagger
 * /api/v1/webhooks/whatsapp:
 *   post:
 *     summary: WhatsApp webhook event handler
 *     description: |
 *       Receives incoming messages and status updates from WhatsApp.
 *       Meta sends POST requests with message events, delivery receipts, and read receipts.
 *       The endpoint verifies the signature before processing.
 *     tags: [Webhooks]
 *     parameters:
 *       - in: header
 *         name: x-hub-signature-256
 *         schema:
 *           type: string
 *         required: true
 *         description: HMAC SHA256 signature of the request body
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               object:
 *                 type: string
 *                 example: "whatsapp_business_account"
 *               entry:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     changes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                           value:
 *                             type: object
 *     responses:
 *       200:
 *         description: Event received and acknowledged
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "EVENT_RECEIVED"
 *       403:
 *         description: Invalid signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/whatsapp',
  webhookController.handleWhatsAppWebhook.bind(webhookController)
);

/**
 * Instagram Webhook Routes
 */

/**
 * @swagger
 * /api/v1/webhooks/instagram:
 *   get:
 *     summary: Instagram webhook verification
 *     description: |
 *       Meta sends a GET request to verify the webhook URL during setup.
 *       This endpoint validates the verify token and returns the challenge.
 *     tags: [Webhooks]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *         required: true
 *         description: Should be "subscribe"
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *         required: true
 *         description: The verify token configured in Meta App settings
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *         required: true
 *         description: Challenge string to return if verification succeeds
 *     responses:
 *       200:
 *         description: Verification successful, returns the challenge
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       403:
 *         description: Verification failed - invalid verify token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get(
  '/instagram',
  webhookController.verifyInstagramWebhook.bind(webhookController)
);

/**
 * @swagger
 * /api/v1/webhooks/instagram:
 *   post:
 *     summary: Instagram webhook event handler
 *     description: |
 *       Receives incoming DMs and status updates from Instagram.
 *       Meta sends POST requests with messaging events.
 *       The endpoint verifies the signature before processing.
 *     tags: [Webhooks]
 *     parameters:
 *       - in: header
 *         name: x-hub-signature-256
 *         schema:
 *           type: string
 *         required: true
 *         description: HMAC SHA256 signature of the request body
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               object:
 *                 type: string
 *                 example: "instagram"
 *               entry:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     time:
 *                       type: number
 *                     messaging:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sender:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                           recipient:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                           timestamp:
 *                             type: number
 *                           message:
 *                             type: object
 *     responses:
 *       200:
 *         description: Event received and acknowledged
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "EVENT_RECEIVED"
 *       403:
 *         description: Invalid signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/instagram',
  webhookController.handleInstagramWebhook.bind(webhookController)
);

export default router;
