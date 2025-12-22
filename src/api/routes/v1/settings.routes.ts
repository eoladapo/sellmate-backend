import { Router } from 'express';
import { SettingsController } from '../../../modules/settings/controllers';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

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
 */
router.get('/', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'getSettings'));

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     summary: Update all user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'updateSettings'));

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
 */
router.get('/profile', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'getBusinessProfile'));

/**
 * @swagger
 * /api/v1/settings/profile:
 *   put:
 *     summary: Update business profile settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business profile updated successfully
 */
router.put('/profile', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'updateBusinessProfile'));

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
 */
router.get('/notifications', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'getNotificationPreferences'));

/**
 * @swagger
 * /api/v1/settings/notifications:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 */
router.put('/notifications', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'updateNotificationPreferences'));

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
 */
router.get('/integrations', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'getIntegrationSettings'));

/**
 * @swagger
 * /api/v1/settings/integrations:
 *   put:
 *     summary: Update integration settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration settings updated successfully
 */
router.put('/integrations', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'updateIntegrationSettings'));

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
 */
router.get('/privacy', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'getDataPrivacySettings'));

/**
 * @swagger
 * /api/v1/settings/privacy:
 *   put:
 *     summary: Update data privacy settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data privacy settings updated successfully
 */
router.put('/privacy', authMiddleware, bind<SettingsController>(TOKENS.SettingsController, 'updateDataPrivacySettings'));

export default router;
