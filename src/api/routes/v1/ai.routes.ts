import { Router } from 'express';
import { AIController } from '../../../modules/ai/controllers/ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * /api/v1/ai/analyze:
 *   post:
 *     summary: Analyze a message for order detection and intent
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Message analysis result
 */
router.post('/analyze', authMiddleware, bind<AIController>(TOKENS.AIController, 'analyzeMessage'));

/**
 * @swagger
 * /api/v1/ai/suggest-response:
 *   post:
 *     summary: Generate response suggestions for a conversation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Response suggestions generated
 */
router.post('/suggest-response', authMiddleware, bind<AIController>(TOKENS.AIController, 'suggestResponse'));

/**
 * @swagger
 * /api/v1/ai/insights:
 *   get:
 *     summary: Generate business insights
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business insights generated
 */
router.get('/insights', authMiddleware, bind<AIController>(TOKENS.AIController, 'getInsights'));

/**
 * @swagger
 * /api/v1/ai/status:
 *   get:
 *     summary: Check AI service availability
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service status
 */
router.get('/status', authMiddleware, bind<AIController>(TOKENS.AIController, 'getStatus'));

export default router;
