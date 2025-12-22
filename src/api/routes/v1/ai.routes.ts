import { Router } from 'express';
import { AIController } from '../../../modules/ai/controllers/ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { container, TOKENS } from '../../../di';

const router = Router();

/**
 * Get AI controller from container
 */
const getController = (): AIController => {
  return container.resolve<AIController>(TOKENS.AIController);
};

/**
 * @swagger
 * /api/v1/ai/analyze:
 *   post:
 *     summary: Analyze a message for order detection and intent
 *     description: Uses AI to analyze message content for potential orders, extract product details, customer information, and detect purchase intent
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageContent
 *             properties:
 *               messageContent:
 *                 type: string
 *                 description: The message content to analyze
 *                 example: "I want to buy 2 pairs of the red shoes for 15000 naira"
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional conversation ID for context
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, instagram]
 *                 description: The platform the message came from
 *               customerHistory:
 *                 type: object
 *                 description: Optional customer history for better analysis
 *     responses:
 *       200:
 *         description: Message analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderDetected:
 *                       type: boolean
 *                       description: Whether an order intent was detected
 *                     confidence:
 *                       type: number
 *                       description: Confidence score (0-1)
 *                     extractedDetails:
 *                       type: object
 *                       properties:
 *                         productName:
 *                           type: string
 *                         quantity:
 *                           type: number
 *                         price:
 *                           type: number
 *                         deliveryAddress:
 *                           type: string
 *                         customerName:
 *                           type: string
 *                     customerIntent:
 *                       type: string
 *                       enum: [inquiry, purchase, complaint, support]
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: AI service error
 */
router.post('/analyze', authMiddleware, (req, res, next) => {
  getController().analyzeMessage(req, res, next);
});

/**
 * @swagger
 * /api/v1/ai/suggest-response:
 *   post:
 *     summary: Generate response suggestions for a conversation
 *     description: Uses AI to generate contextually appropriate response suggestions based on conversation history and customer intent
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 description: The conversation ID to generate suggestions for
 *               messageContent:
 *                 type: string
 *                 description: The latest message content
 *               tone:
 *                 type: string
 *                 enum: [professional, friendly, casual]
 *                 default: friendly
 *                 description: The tone for generated responses
 *               language:
 *                 type: string
 *                 enum: [english, pidgin, mixed]
 *                 default: english
 *                 description: The language for generated responses
 *     responses:
 *       200:
 *         description: Response suggestions generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             description: The suggested response text
 *                           type:
 *                             type: string
 *                             enum: [confirmation, clarification, upsell, support]
 *                           confidence:
 *                             type: number
 *                             description: Confidence score for this suggestion
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: AI service error
 */
router.post('/suggest-response', authMiddleware, (req, res, next) => {
  getController().suggestResponse(req, res, next);
});

/**
 * @swagger
 * /api/v1/ai/insights:
 *   get:
 *     summary: Generate business insights
 *     description: Uses AI to analyze business data and generate actionable insights including customer value predictions, purchase trends, and optimization suggestions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis period
 *       - in: query
 *         name: insightTypes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [upsell, customer_value, trend_analysis]
 *         description: Types of insights to generate
 *     responses:
 *       200:
 *         description: Business insights generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           actionable:
 *                             type: boolean
 *                           priority:
 *                             type: string
 *                             enum: [high, medium, low]
 *                     highValueCustomers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           customerId:
 *                             type: string
 *                           predictedValue:
 *                             type: number
 *                           purchaseProbability:
 *                             type: number
 *                     trends:
 *                       type: object
 *                       properties:
 *                         topProducts:
 *                           type: array
 *                           items:
 *                             type: string
 *                         peakHours:
 *                           type: array
 *                           items:
 *                             type: string
 *                         growthRate:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: AI service error
 */
router.get('/insights', authMiddleware, (req, res, next) => {
  getController().getInsights(req, res, next);
});

/**
 * @swagger
 * /api/v1/ai/status:
 *   get:
 *     summary: Check AI service availability
 *     description: Returns the current status of the AI service including availability and configuration
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       description: Whether the AI service is available
 *                     provider:
 *                       type: string
 *                       description: The AI provider being used
 *                       example: "gemini"
 *                     features:
 *                       type: object
 *                       properties:
 *                         orderDetection:
 *                           type: boolean
 *                         responseGeneration:
 *                           type: boolean
 *                         businessInsights:
 *                           type: boolean
 *                     rateLimit:
 *                       type: object
 *                       properties:
 *                         remaining:
 *                           type: number
 *                         resetAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       503:
 *         description: AI service unavailable
 */
router.get('/status', authMiddleware, (req, res, next) => {
  getController().getStatus(req, res, next);
});

export default router;
