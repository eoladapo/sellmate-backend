import { Router } from 'express';
import { Container } from 'typedi';
import { IntegrationController } from '../../../modules/integrations/controllers';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { connectIntegrationSchema, triggerSyncSchema } from '../../../modules/integrations/dto';

const router = Router();

/**
 * Get integration controller from DI container
 */
const getController = (): IntegrationController => {
  return Container.get<IntegrationController>('IntegrationController');
};

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Social platform integration management (WhatsApp & Instagram)
 */

/**
 * @swagger
 * /api/v1/integrations/status:
 *   get:
 *     summary: Get status of all integrations
 *     description: Returns the connection status for WhatsApp and Instagram integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration statuses retrieved successfully
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
 *                     whatsapp:
 *                       $ref: '#/components/schemas/IntegrationStatus'
 *                     instagram:
 *                       $ref: '#/components/schemas/IntegrationStatus'
 *       401:
 *         description: Unauthorized
 */
router.get('/status', authMiddleware, (req, res, next) => {
  return getController().getIntegrationStatus(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/health:
 *   get:
 *     summary: Get health status of connected integrations
 *     description: Performs health checks on all connected platforms
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       isHealthy:
 *                         type: boolean
 *                       apiReachable:
 *                         type: boolean
 *                       tokenValid:
 *                         type: boolean
 *                       webhookConfigured:
 *                         type: boolean
 *                       errors:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/health', authMiddleware, (req, res, next) => {
  return getController().getHealthStatus(req, res, next);
});


/**
 * @swagger
 * /api/v1/integrations/whatsapp/connect:
 *   post:
 *     summary: Connect WhatsApp Business integration
 *     description: Connects a WhatsApp Business account to the user's SellMate account
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessAccountId
 *               - accessToken
 *             properties:
 *               businessAccountId:
 *                 type: string
 *                 description: WhatsApp Business Account ID
 *                 example: "123456789012345"
 *               accessToken:
 *                 type: string
 *                 description: WhatsApp Business API access token
 *                 example: "EAABsbCS..."
 *     responses:
 *       200:
 *         description: WhatsApp connected successfully
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
 *                     platform:
 *                       type: string
 *                       example: "whatsapp"
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     businessAccountId:
 *                       type: string
 *                     connectedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid credentials or connection failed
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/whatsapp/connect',
  authMiddleware,
  validateBody(connectIntegrationSchema),
  (req, res, next) => {
    return getController().connectWhatsApp(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/integrations/whatsapp/disconnect:
 *   delete:
 *     summary: Disconnect WhatsApp Business integration
 *     description: Disconnects the WhatsApp Business account from the user's SellMate account
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: WhatsApp disconnected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No WhatsApp integration found
 */
router.delete('/whatsapp/disconnect', authMiddleware, (req, res, next) => {
  return getController().disconnectWhatsApp(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/instagram/connect:
 *   post:
 *     summary: Connect Instagram Business integration
 *     description: Connects an Instagram Business account to the user's SellMate account
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessAccountId
 *               - accessToken
 *             properties:
 *               businessAccountId:
 *                 type: string
 *                 description: Instagram Business Account ID
 *                 example: "17841400000000000"
 *               accessToken:
 *                 type: string
 *                 description: Instagram API access token
 *                 example: "IGQVJYeU..."
 *     responses:
 *       200:
 *         description: Instagram connected successfully
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
 *                     platform:
 *                       type: string
 *                       example: "instagram"
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     businessAccountId:
 *                       type: string
 *                     connectedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid credentials or connection failed
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/instagram/connect',
  authMiddleware,
  validateBody(connectIntegrationSchema),
  (req, res, next) => {
    return getController().connectInstagram(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/integrations/instagram/disconnect:
 *   delete:
 *     summary: Disconnect Instagram Business integration
 *     description: Disconnects the Instagram Business account from the user's SellMate account
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Instagram disconnected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No Instagram integration found
 */
router.delete('/instagram/disconnect', authMiddleware, (req, res, next) => {
  return getController().disconnectInstagram(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/sync:
 *   post:
 *     summary: Trigger manual sync for a platform
 *     description: Manually triggers message synchronization for a specific platform
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, instagram]
 *                 description: Platform to sync
 *                 example: "whatsapp"
 *     responses:
 *       200:
 *         description: Sync completed successfully
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
 *                     messagesCount:
 *                       type: integer
 *                       description: Number of messages synced
 *                     conversationsCount:
 *                       type: integer
 *                       description: Number of conversations updated
 *                     lastSyncAt:
 *                       type: string
 *                       format: date-time
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more messages to sync
 *       400:
 *         description: Platform not connected or invalid platform
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Sync already in progress
 */
router.post(
  '/sync',
  authMiddleware,
  validateBody(triggerSyncSchema),
  (req, res, next) => {
    return getController().triggerSync(req, res, next);
  }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     IntegrationStatus:
 *       type: object
 *       properties:
 *         connected:
 *           type: boolean
 *           description: Whether the platform is connected
 *         status:
 *           type: string
 *           enum: [connected, disconnected, error, pending]
 *           description: Current connection status
 *         businessAccountId:
 *           type: string
 *           description: Business account ID (if connected)
 *         businessAccountName:
 *           type: string
 *           description: Business account name (if available)
 *         connectedAt:
 *           type: string
 *           format: date-time
 *           description: When the integration was connected
 *         lastSyncAt:
 *           type: string
 *           format: date-time
 *           description: Last successful sync timestamp
 *         lastError:
 *           type: string
 *           description: Last error message (if any)
 *         tokenExpiresAt:
 *           type: string
 *           format: date-time
 *           description: When the access token expires
 *         isTokenExpiringSoon:
 *           type: boolean
 *           description: Whether the token expires within 24 hours
 */

export default router;
