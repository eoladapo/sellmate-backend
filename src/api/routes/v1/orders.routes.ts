import { Router, Request, Response, NextFunction } from 'express';
import { OrderController } from '../../../modules/orders/controllers';
import { authMiddleware } from '../../middleware';
import { getService } from '../../../container';

const router = Router();

const getOrderController = (): OrderController => getService<OrderController>('OrderController');

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, confirmed, delivered, cancelled, expired, abandoned]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().listOrders(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create order (expires in 48 hours if not confirmed)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - customer
 *             properties:
 *               customerId:
 *                 type: string
 *               conversationId:
 *                 type: string
 *               product:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   sellingPrice:
 *                     type: number
 *                   costPrice:
 *                     type: number
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   contact:
 *                     type: string
 *                   deliveryAddress:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created with 48-hour expiration
 */
router.post('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().createOrder(req, res, next);
});

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
router.get('/abandoned', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().getAbandonedOrders(req, res, next);
});

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
router.get('/expired', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().getExpiredOrders(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders/customer/{customerId}:
 *   get:
 *     summary: Get orders by customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer orders
 */
router.get('/customer/:customerId', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().getOrdersByCustomer(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
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
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().getOrder(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update order
 *     tags: [Orders]
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
 *               product:
 *                 type: object
 *               customer:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 */
router.put('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().updateOrder(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, pending, confirmed, delivered, cancelled, expired, abandoned]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().updateOrderStatus(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders/{id}/reactivate:
 *   post:
 *     summary: Reactivate expired or abandoned order (resets 48-hour timer)
 *     tags: [Orders]
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
 *         description: Order reactivated with new 48-hour expiration
 *       400:
 *         description: Order cannot be reactivated (not expired/abandoned)
 */
router.post('/:id/reactivate', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().reactivateOrder(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders/{id}/abandon:
 *   post:
 *     summary: Mark order as abandoned
 *     tags: [Orders]
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
 *         description: Order marked as abandoned
 *       400:
 *         description: Cannot abandon confirmed/delivered orders
 */
router.post('/:id/abandon', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().markAsAbandoned(req, res, next);
});

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
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
 *         description: Order deleted
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getOrderController().deleteOrder(req, res, next);
});

export default router;
