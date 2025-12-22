import { Router, Request, Response, NextFunction } from 'express';
import { ConversationController } from '../../../modules/conversations/controllers';
import { authMiddleware } from '../../middleware';
import { getService } from '../../../container';

const router = Router();

// Lazy getter for Conversation controller
const getConversationController = (): ConversationController =>
  getService<ConversationController>('ConversationController');

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: List conversations for authenticated user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [whatsapp, instagram]
 *         description: Filter by platform
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread conversations
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: List of conversations
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().listConversations(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/unread-count:
 *   get:
 *     summary: Get total unread message count
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().getUnreadCount(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/sync:
 *   post:
 *     summary: Trigger message synchronization
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, instagram]
 *     responses:
 *       202:
 *         description: Sync initiated
 *       400:
 *         description: Invalid platform or sync failed
 */
router.post('/sync', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().triggerSync(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/sync/status:
 *   get:
 *     summary: Get sync status for all platforms
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status for all platforms
 */
router.get('/sync/status', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().getSyncStatus(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/manual:
 *   post:
 *     summary: Create a manual conversation (Lite Mode)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - platform
 *             properties:
 *               customerName:
 *                 type: string
 *               customerContact:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, instagram]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation created
 *       400:
 *         description: Validation error
 */
router.post('/manual', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().createManualConversation(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   get:
 *     summary: Get conversation details with messages
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation details
 *       404:
 *         description: Conversation not found
 */
router.get('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().getConversation(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   put:
 *     summary: Update conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantName:
 *                 type: string
 *               notes:
 *                 type: string
 *               customerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation updated
 *       404:
 *         description: Conversation not found
 */
router.put('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().updateConversation(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   delete:
 *     summary: Delete conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Conversation deleted
 *       404:
 *         description: Conversation not found
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().deleteConversation(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   post:
 *     summary: Send message in conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent
 *       404:
 *         description: Conversation not found
 */
router.post('/:id/messages', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().sendMessage(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}/messages/manual:
 *   post:
 *     summary: Add manual message (Lite Mode)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - sender
 *             properties:
 *               content:
 *                 type: string
 *               sender:
 *                 type: string
 *                 enum: [customer, seller]
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Message added
 *       404:
 *         description: Conversation not found
 */
router.post('/:id/messages/manual', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().addManualMessage(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}/read:
 *   put:
 *     summary: Mark conversation as read
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *       404:
 *         description: Conversation not found
 */
router.put('/:id/read', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().markAsRead(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}/archive:
 *   put:
 *     summary: Archive conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation archived
 *       404:
 *         description: Conversation not found
 */
router.put('/:id/archive', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().archiveConversation(req, res, next);
});

/**
 * @swagger
 * /api/v1/conversations/{id}/customer:
 *   put:
 *     summary: Link customer to conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer linked
 *       404:
 *         description: Conversation not found
 */
router.put('/:id/customer', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getConversationController().linkCustomer(req, res, next);
});

export default router;
