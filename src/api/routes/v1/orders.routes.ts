import { Router } from 'express';
import { OrderController } from '../../../modules/orders/controllers';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'listOrders'));

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create order (expires in 48 hours if not confirmed)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created with 48-hour expiration
 */
router.post('/', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'createOrder'));

/**
 * @swagger
 * /api/v1/orders/abandoned:
 *   get:
 *     summary: Get abandoned orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of abandoned orders
 */
router.get('/abandoned', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'getAbandonedOrders'));

/**
 * @swagger
 * /api/v1/orders/expired:
 *   get:
 *     summary: Get expired orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expired orders
 */
router.get('/expired', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'getExpiredOrders'));

/**
 * @swagger
 * /api/v1/orders/customer/{customerId}:
 *   get:
 *     summary: Get orders by customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer orders
 */
router.get('/customer/:customerId', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'getOrdersByCustomer'));

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'getOrder'));

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order updated
 */
router.put('/:id', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'updateOrder'));

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'updateOrderStatus'));

/**
 * @swagger
 * /api/v1/orders/{id}/reactivate:
 *   post:
 *     summary: Reactivate expired or abandoned order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order reactivated
 */
router.post('/:id/reactivate', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'reactivateOrder'));

/**
 * @swagger
 * /api/v1/orders/{id}/abandon:
 *   post:
 *     summary: Mark order as abandoned
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order marked as abandoned
 */
router.post('/:id/abandon', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'markAsAbandoned'));

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Order deleted
 */
router.delete('/:id', authMiddleware, bind<OrderController>(TOKENS.OrderController, 'deleteOrder'));

export default router;
