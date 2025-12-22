import { Router } from 'express';
import { IntegrationController } from '../../../modules/integrations/controllers';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { connectIntegrationSchema, triggerSyncSchema } from '../../../modules/integrations/dto';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

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
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration statuses retrieved successfully
 */
router.get('/status', authMiddleware, bind<IntegrationController>(TOKENS.IntegrationController, 'getIntegrationStatus'));

/**
 * @swagger
 * /api/v1/integrations/health:
 *   get:
 *     summary: Get health status of connected integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 */
router.get('/health', authMiddleware, bind<IntegrationController>(TOKENS.IntegrationController, 'getHealthStatus'));

/**
 * @swagger
 * /api/v1/integrations/whatsapp/connect:
 *   post:
 *     summary: Connect WhatsApp Business integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp connected successfully
 */
router.post(
  '/whatsapp/connect',
  authMiddleware,
  validateBody(connectIntegrationSchema),
  bind<IntegrationController>(TOKENS.IntegrationController, 'connectWhatsApp')
);

/**
 * @swagger
 * /api/v1/integrations/whatsapp/disconnect:
 *   delete:
 *     summary: Disconnect WhatsApp Business integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: WhatsApp disconnected successfully
 */
router.delete('/whatsapp/disconnect', authMiddleware, bind<IntegrationController>(TOKENS.IntegrationController, 'disconnectWhatsApp'));

/**
 * @swagger
 * /api/v1/integrations/instagram/connect:
 *   post:
 *     summary: Connect Instagram Business integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instagram connected successfully
 */
router.post(
  '/instagram/connect',
  authMiddleware,
  validateBody(connectIntegrationSchema),
  bind<IntegrationController>(TOKENS.IntegrationController, 'connectInstagram')
);

/**
 * @swagger
 * /api/v1/integrations/instagram/disconnect:
 *   delete:
 *     summary: Disconnect Instagram Business integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Instagram disconnected successfully
 */
router.delete('/instagram/disconnect', authMiddleware, bind<IntegrationController>(TOKENS.IntegrationController, 'disconnectInstagram'));

/**
 * @swagger
 * /api/v1/integrations/sync:
 *   post:
 *     summary: Trigger manual sync for a platform
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
router.post(
  '/sync',
  authMiddleware,
  validateBody(triggerSyncSchema),
  bind<IntegrationController>(TOKENS.IntegrationController, 'triggerSync')
);

export default router;
