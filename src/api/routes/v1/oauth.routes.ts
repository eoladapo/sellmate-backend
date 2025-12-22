import { Router, Request, Response, NextFunction } from 'express';
import { OAuthController } from '../../../modules/auth/controllers/oauth.controller';
import { authMiddleware } from '../../middleware';
import { getService } from '../../../container';

const router = Router();

// Lazy getter for OAuth controller (container must be initialized first)
const getOAuthController = (): OAuthController => getService<OAuthController>('OAuthController');

/**
 * @swagger
 * /api/v1/auth/oauth/whatsapp:
 *   get:
 *     summary: Initiate WhatsApp OAuth flow
 *     description: |
 *       Initiates the OAuth 2.0 flow for connecting a WhatsApp Business account.
 *       Returns an authorization URL that the user should be redirected to.
 *       The user will authenticate with Meta and grant permissions to SellMate.
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth initiation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorizationUrl:
 *                       type: string
 *                       format: uri
 *                       description: URL to redirect the user for OAuth authorization
 *                     state:
 *                       type: string
 *                       description: State parameter for CSRF protection
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/whatsapp', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOAuthController().initiateWhatsAppOAuth(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/oauth/whatsapp/callback:
 *   get:
 *     summary: Handle WhatsApp OAuth callback
 *     description: |
 *       Handles the OAuth callback from Meta after user authorization.
 *       Exchanges the authorization code for access tokens and stores them securely.
 *       This endpoint is called by Meta's OAuth server, not directly by the client.
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Meta
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State parameter for CSRF validation
 *     responses:
 *       302:
 *         description: Redirects to frontend with success or error status
 *       400:
 *         description: Invalid state or authorization code
 */
router.get('/whatsapp/callback', (req: Request, res: Response, next: NextFunction) => {
  getOAuthController().handleWhatsAppCallback(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/oauth/whatsapp/disconnect:
 *   delete:
 *     summary: Disconnect WhatsApp account
 *     description: |
 *       Disconnects the WhatsApp Business account from the user's SellMate account.
 *       Revokes stored tokens and removes the integration. Existing conversations are preserved.
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: WhatsApp account disconnected successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No WhatsApp integration found
 */
router.delete('/whatsapp/disconnect', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOAuthController().disconnectWhatsApp(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/oauth/instagram:
 *   get:
 *     summary: Initiate Instagram OAuth flow
 *     description: |
 *       Initiates the OAuth 2.0 flow for connecting an Instagram Business account.
 *       Returns an authorization URL that the user should be redirected to.
 *       Requires an Instagram Business or Creator account linked to a Facebook Page.
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth initiation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorizationUrl:
 *                       type: string
 *                       format: uri
 *                       description: URL to redirect the user for OAuth authorization
 *                     state:
 *                       type: string
 *                       description: State parameter for CSRF protection
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/instagram', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOAuthController().initiateInstagramOAuth(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/oauth/instagram/callback:
 *   get:
 *     summary: Handle Instagram OAuth callback
 *     description: |
 *       Handles the OAuth callback from Meta after user authorization.
 *       Exchanges the authorization code for access tokens and stores them securely.
 *       This endpoint is called by Meta's OAuth server, not directly by the client.
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Meta
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State parameter for CSRF validation
 *     responses:
 *       302:
 *         description: Redirects to frontend with success or error status
 *       400:
 *         description: Invalid state or authorization code
 */
router.get('/instagram/callback', (req: Request, res: Response, next: NextFunction) => {
  getOAuthController().handleInstagramCallback(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/oauth/instagram/disconnect:
 *   delete:
 *     summary: Disconnect Instagram account
 *     description: |
 *       Disconnects the Instagram Business account from the user's SellMate account.
 *       Revokes stored tokens and removes the integration. Existing conversations are preserved.
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instagram disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Instagram account disconnected successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No Instagram integration found
 */
router.delete('/instagram/disconnect', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOAuthController().disconnectInstagram(req, res, next);
});

export default router;
