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

/**
 * API v1 router
 * Organizes all v1 endpoints
 */
const router = Router();

/**
 * V1 API information endpoint
 */
router.get('/', (_req, res) => {
  return successResponse(res, {
    version: 'v1',
    description: 'SellMate Platform API v1',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: '/api/v1/auth',
      webhooks: '/api/v1/webhooks',
      conversations: '/api/v1/conversations',
      orders: '/api/v1/orders',
      customers: '/api/v1/customers',
      analytics: '/api/v1/analytics',
      integrations: '/api/v1/integrations',
      settings: '/api/v1/settings',
      notifications: '/api/v1/notifications',
      privacy: '/api/v1/privacy',
      support: '/api/v1/support',
      subscription: '/api/v1/subscription',
      ai: '/api/v1/ai',
    },
  }, 'API v1 endpoints');
});

// Register implemented routes
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

// TODO: Register routes as modules are implemented
// import conversationRoutes from './conversations.routes';
// import orderRoutes from './orders.routes';
// import customerRoutes from './customers.routes';
// import analyticsRoutes from './analytics.routes';
// import integrationRoutes from './integrations.routes';
// import settingsRoutes from './settings.routes';
// import notificationRoutes from './notifications.routes';
// import privacyRoutes from './privacy.routes';
// import supportRoutes from './support.routes';
// import subscriptionRoutes from './subscription.routes';
// import aiRoutes from './ai.routes';

// router.use('/conversations', conversationRoutes);
// router.use('/orders', orderRoutes);
// router.use('/customers', customerRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/integrations', integrationRoutes);
// router.use('/settings', settingsRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/privacy', privacyRoutes);
// router.use('/support', supportRoutes);
// router.use('/subscription', subscriptionRoutes);
// router.use('/ai', aiRoutes);

export default router;