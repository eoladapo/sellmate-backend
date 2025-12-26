import { Router } from 'express';
import { AuthController } from '../../../modules/auth/controllers/auth.controller';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';
import oauthRoutes from './oauth.routes';

const router = Router();

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
router.post('/register', bind<AuthController>(TOKENS.AuthController, 'register'));

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
router.post('/login', bind<AuthController>(TOKENS.AuthController, 'login'));

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
router.post('/verify-otp', bind<AuthController>(TOKENS.AuthController, 'verifyOTPAndLogin'));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
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
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *       400:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', bind<AuthController>(TOKENS.AuthController, 'refreshToken'));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
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
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: Invalid refresh token
 */
router.post('/logout', bind<AuthController>(TOKENS.AuthController, 'logout'));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authMiddleware, bind<AuthController>(TOKENS.AuthController, 'getCurrentUser'));

// Mount OAuth routes under /oauth
router.use('/oauth', oauthRoutes);

export default router;
