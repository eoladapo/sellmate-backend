import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../modules/auth/controllers/auth.controller';
import { authMiddleware } from '../../middleware';
import { getService } from '../../../container';
import oauthRoutes from './oauth.routes';

const router = Router();

// Lazy getter for Auth controller (container must be initialized first)
const getAuthController = (): AuthController => getService<AuthController>('AuthController');

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - businessName
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348123456789"
 *               businessName:
 *                 type: string
 *                 example: "Kemi's Fashion Store"
 *               email:
 *                 type: string
 *                 example: "kemi@example.com"
 *     responses:
 *       201:
 *         description: User registered successfully, OTP sent
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  getAuthController().register(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login existing user (sends OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348123456789"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number
 */
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  getAuthController().login(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348123456789"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful, returns tokens
 *       400:
 *         description: Invalid OTP or too many attempts
 */
router.post('/verify-otp', (req: Request, res: Response, next: NextFunction) => {
  getAuthController().verifyOTPAndLogin(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token. The refresh token remains valid until it expires or is revoked.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token obtained during login
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Invalid or expired refresh token
 *       401:
 *         description: Refresh token has been revoked
 */
router.post('/refresh', (req: Request, res: Response, next: NextFunction) => {
  getAuthController().refreshToken(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revokes the current refresh token, effectively logging out the user from the current device. The access token will remain valid until it expires.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to revoke
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logged out successfully
 *       400:
 *         description: Invalid refresh token
 */
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  getAuthController().logout(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: Revokes all refresh tokens for the authenticated user, logging them out from all devices. Requires a valid access token.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
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
 *                   example: Logged out from all devices
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionsRevoked:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout-all', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAuthController().logoutAllDevices(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile information of the currently authenticated user including connected platforms and business details.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAuthController().getCurrentUser(req, res, next);
});

// Mount OAuth routes under /oauth
router.use('/oauth', oauthRoutes);

export default router;
