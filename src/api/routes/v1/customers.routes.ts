import { Router, Request, Response, NextFunction } from 'express';
import { CustomerController } from '../../../modules/customers/controllers';
import { authMiddleware } from '../../middleware';
import { getService } from '../../../container';

const router = Router();

const getCustomerController = (): CustomerController =>
  getService<CustomerController>('CustomerController');

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: List customers for authenticated user
 *     tags: [Customers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or phone
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
 *         description: List of customers
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getCustomerController().listCustomers(req, res, next);
});

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               platforms:
 *                 type: object
 *                 properties:
 *                   whatsapp:
 *                     type: object
 *                     properties:
 *                       phoneNumber:
 *                         type: string
 *                       profileName:
 *                         type: string
 *                   instagram:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       profileName:
 *                         type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created
 *       400:
 *         description: Validation error
 */
router.post('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getCustomerController().createCustomer(req, res, next);
});

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer details
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
router.get('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getCustomerController().getCustomer(req, res, next);
});

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated
 *       404:
 *         description: Customer not found
 */
router.put('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getCustomerController().updateCustomer(req, res, next);
});

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
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
 *         description: Customer deleted
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getCustomerController().deleteCustomer(req, res, next);
});

/**
 * @swagger
 * /api/v1/customers/{id}/insights:
 *   get:
 *     summary: Get customer insights
 *     tags: [Customers]
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
 *         description: Customer insights including order history and platform info
 *       404:
 *         description: Customer not found
 */
router.get('/:id/insights', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getCustomerController().getCustomerInsights(req, res, next);
});

export default router;
