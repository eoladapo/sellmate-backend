import { Router } from 'express';
import { OAuthController } from '../../../modules/auth/controllers/oauth.controller';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/oauth/whatsapp:
 *   get:
 *     summary: Initiate WhatsApp OAuth flow
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth initiation successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/whatsapp', authMiddleware, bind<OAuthController>(TOKENS.OAuthController, 'initiateWhatsAppOAuth'));

/**
 * @swagger
 * /api/v1/auth/oauth/whatsapp/callback:
 *   get:
 *     summary: Handle WhatsApp OAuth callback
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with success or error status
 *       400:
 *         description: Invalid state or authorization code
 */
router.get('/whatsapp/callback', bind<OAuthController>(TOKENS.OAuthController, 'handleWhatsAppCallback'));

/**
 * @swagger
 * /api/v1/auth/oauth/whatsapp/disconnect:
 *   delete:
 *     summary: Disconnect WhatsApp account
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp disconnected successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No WhatsApp integration found
 */
router.delete('/whatsapp/disconnect', authMiddleware, bind<OAuthController>(TOKENS.OAuthController, 'disconnectWhatsApp'));

/**
 * @swagger
 * /api/v1/auth/oauth/instagram:
 *   get:
 *     summary: Initiate Instagram OAuth flow
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth initiation successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/instagram', authMiddleware, bind<OAuthController>(TOKENS.OAuthController, 'initiateInstagramOAuth'));

/**
 * @swagger
 * /api/v1/auth/oauth/instagram/callback:
 *   get:
 *     summary: Handle Instagram OAuth callback
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with success or error status
 *       400:
 *         description: Invalid state or authorization code
 */
router.get('/instagram/callback', bind<OAuthController>(TOKENS.OAuthController, 'handleInstagramCallback'));

/**
 * @swagger
 * /api/v1/auth/oauth/instagram/disconnect:
 *   delete:
 *     summary: Disconnect Instagram account
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instagram disconnected successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No Instagram integration found
 */
router.delete('/instagram/disconnect', authMiddleware, bind<OAuthController>(TOKENS.OAuthController, 'disconnectInstagram'));

export default router;
