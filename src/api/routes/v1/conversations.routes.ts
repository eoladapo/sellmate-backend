import { Router } from 'express';
import { ConversationController } from '../../../modules/conversations/controllers';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: List conversations for authenticated user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'listConversations'));

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
router.get('/unread-count', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'getUnreadCount'));

/**
 * @swagger
 * /api/v1/conversations/sync:
 *   post:
 *     summary: Trigger message synchronization
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Sync initiated
 */
router.post('/sync', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'triggerSync'));

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
router.get('/sync/status', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'getSyncStatus'));

/**
 * @swagger
 * /api/v1/conversations/manual:
 *   post:
 *     summary: Create a manual conversation (Lite Mode)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Conversation created
 */
router.post('/manual', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'createManualConversation'));

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   get:
 *     summary: Get conversation details with messages
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation details
 */
router.get('/:id', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'getConversation'));

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   put:
 *     summary: Update conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation updated
 */
router.put('/:id', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'updateConversation'));

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   delete:
 *     summary: Delete conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Conversation deleted
 */
router.delete('/:id', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'deleteConversation'));

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   post:
 *     summary: Send message in conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/:id/messages', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'sendMessage'));

/**
 * @swagger
 * /api/v1/conversations/{id}/messages/manual:
 *   post:
 *     summary: Add manual message (Lite Mode)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Message added
 */
router.post('/:id/messages/manual', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'addManualMessage'));

/**
 * @swagger
 * /api/v1/conversations/{id}/read:
 *   put:
 *     summary: Mark conversation as read
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.put('/:id/read', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'markAsRead'));

/**
 * @swagger
 * /api/v1/conversations/{id}/archive:
 *   put:
 *     summary: Archive conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation archived
 */
router.put('/:id/archive', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'archiveConversation'));

/**
 * @swagger
 * /api/v1/conversations/{id}/customer:
 *   put:
 *     summary: Link customer to conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer linked
 */
router.put('/:id/customer', authMiddleware, bind<ConversationController>(TOKENS.ConversationController, 'linkCustomer'));

export default router;
