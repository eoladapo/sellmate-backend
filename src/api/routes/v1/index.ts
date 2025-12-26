import { Router } from 'express';
import { successResponse } from '../../../shared/utils/response.util';

// Import route modules
import authRoutes from './auth.routes';
import webhookRoutes from './webhook.routes';
import conversationRoutes from './conversations.routes';
import customerRoutes from './customers.routes';
import orderRoutes from './orders.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notifications.routes';
import aiRoutes from './ai.routes';
import settingsRoutes from './settings.routes';
import subscriptionRoutes from './subscription.routes';
import integrationRoutes from './integrations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/conversations', conversationRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingsRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/integrations', integrationRoutes);

export default router;