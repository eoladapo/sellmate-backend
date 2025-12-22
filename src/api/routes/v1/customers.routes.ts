import { Router } from 'express';
import { CustomerController } from '../../../modules/customers/controllers';
import { authMiddleware } from '../../middleware';
import { TOKENS } from '../../../di';
import { bind } from '../../utils/controller-bind';

const router = Router();

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: List customers for authenticated user
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/', authMiddleware, bind<CustomerController>(TOKENS.CustomerController, 'listCustomers'));

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Customer created
 */
router.post('/', authMiddleware, bind<CustomerController>(TOKENS.CustomerController, 'createCustomer'));

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer details
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer details
 */
router.get('/:id', authMiddleware, bind<CustomerController>(TOKENS.CustomerController, 'getCustomer'));

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer updated
 */
router.put('/:id', authMiddleware, bind<CustomerController>(TOKENS.CustomerController, 'updateCustomer'));

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Customer deleted
 */
router.delete('/:id', authMiddleware, bind<CustomerController>(TOKENS.CustomerController, 'deleteCustomer'));

/**
 * @swagger
 * /api/v1/customers/{id}/insights:
 *   get:
 *     summary: Get customer insights
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer insights
 */
router.get('/:id/insights', authMiddleware, bind<CustomerController>(TOKENS.CustomerController, 'getCustomerInsights'));

export default router;
