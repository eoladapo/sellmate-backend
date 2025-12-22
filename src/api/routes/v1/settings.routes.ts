import { Router, Request, Response, NextFunction } from 'express';
import { SettingsController } from '../../../modules/settings/controllers';
import { authMiddleware } from '../../middleware';
import { container, TOKENS } from '../../../di';

const router = Router();

const getSettingsController = (): SettingsController =>
  container.resolve<SettingsController>(TOKENS.SettingsController);

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get all user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().getSettings(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     summary: Update all user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequest'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.put('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().updateSettings(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/profile:
 *   get:
 *     summary: Get business profile settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessProfile'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().getBusinessProfile(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/profile:
 *   put:
 *     summary: Update business profile settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Business name
 *               contactPhone:
 *                 type: string
 *                 description: Contact phone number
 *               defaultLocation:
 *                 type: string
 *                 description: Default business location
 *               businessHours:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     description: Opening time (HH:MM)
 *                   end:
 *                     type: string
 *                     description: Closing time (HH:MM)
 *     responses:
 *       200:
 *         description: Business profile updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().updateBusinessProfile(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/notifications:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreferences'
 *       401:
 *         description: Unauthorized
 */
router.get('/notifications', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().getNotificationPreferences(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/notifications:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newMessage:
 *                 $ref: '#/components/schemas/NotificationTypeSetting'
 *               orderDetected:
 *                 $ref: '#/components/schemas/NotificationTypeSetting'
 *               orderStatusChanged:
 *                 $ref: '#/components/schemas/NotificationTypeSetting'
 *               orderExpiring:
 *                 $ref: '#/components/schemas/NotificationTypeSetting'
 *               lowInventory:
 *                 $ref: '#/components/schemas/ThresholdNotificationSetting'
 *               profitAlert:
 *                 $ref: '#/components/schemas/MarginNotificationSetting'
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.put('/notifications', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().updateNotificationPreferences(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/integrations:
 *   get:
 *     summary: Get integration settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/integrations', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().getIntegrationSettings(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/integrations:
 *   put:
 *     summary: Update integration settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               whatsapp:
 *                 type: object
 *                 properties:
 *                   autoSync:
 *                     type: boolean
 *                   syncInterval:
 *                     type: number
 *               instagram:
 *                 type: object
 *                 properties:
 *                   autoSync:
 *                     type: boolean
 *                   syncComments:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Integration settings updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.put('/integrations', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().updateIntegrationSettings(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/privacy:
 *   get:
 *     summary: Get data privacy settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data privacy settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/privacy', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().getDataPrivacySettings(req, res, next);
});

/**
 * @swagger
 * /api/v1/settings/privacy:
 *   put:
 *     summary: Update data privacy settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataRetentionDays:
 *                 type: number
 *                 description: Data retention period in days
 *               allowAnalytics:
 *                 type: boolean
 *               allowMarketing:
 *                 type: boolean
 *               allowDataSharing:
 *                 type: boolean
 *               allowAiProcessing:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Data privacy settings updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.put('/privacy', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getSettingsController().updateDataPrivacySettings(req, res, next);
});

export default router;
