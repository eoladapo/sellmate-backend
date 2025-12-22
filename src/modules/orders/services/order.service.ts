import { injectable, inject } from 'tsyringe';
import { Order } from '../entities';
import { OrderRepository } from '../repositories/order.repository';
import {
  IOrderService,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { OrderStatus } from '../enums';
import { AppError } from '../../../api/middleware/error.middleware';
import { TOKENS } from '../../../di/tokens';

const ORDER_EXPIRATION_HOURS = 48;

@injectable()
export class OrderService implements IOrderService {
  constructor(@inject(TOKENS.OrderRepository) private orderRepository: OrderRepository) {}

  async getOrders(
    userId: string,
    filters?: OrderFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findByUser(userId, filters, pagination);
  }

  async getOrderById(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    return order;
  }

  async getOrdersByCustomer(userId: string, customerId: string): Promise<Order[]> {
    return this.orderRepository.findByCustomer(userId, customerId);
  }

  async getAbandonedOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.findAbandonedOrders(userId);
  }

  async getExpiredOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.findExpiredOrders(userId);
  }

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    const totalAmount = request.product.sellingPrice * request.product.quantity;
    const profit = request.product.costPrice
      ? (request.product.sellingPrice - request.product.costPrice) * request.product.quantity
      : undefined;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ORDER_EXPIRATION_HOURS);

    return this.orderRepository.create({
      userId: request.userId,
      customerId: request.customerId,
      conversationId: request.conversationId,
      sourceMessageId: request.sourceMessageId,
      status: OrderStatus.DRAFT,
      product: request.product,
      customer: request.customer,
      totalAmount,
      profit,
      notes: request.notes,
      expiresAt,
    });
  }

  async updateOrder(orderId: string, userId: string, updates: UpdateOrderRequest): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);

    const product = updates.product ? { ...order.product, ...updates.product } : order.product;
    const customer = updates.customer ? { ...order.customer, ...updates.customer } : order.customer;

    const totalAmount = product.sellingPrice * product.quantity;
    const profit = product.costPrice
      ? (product.sellingPrice - product.costPrice) * product.quantity
      : order.profit;

    return this.orderRepository.update(orderId, {
      product,
      customer,
      totalAmount,
      profit,
      notes: updates.notes ?? order.notes,
    });
  }

  async updateOrderStatus(orderId: string, userId: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);

    // Clear expiration when order is confirmed or delivered
    const expiresAt =
      status === OrderStatus.CONFIRMED || status === OrderStatus.DELIVERED
        ? undefined
        : order.expiresAt;

    return this.orderRepository.update(orderId, { status, expiresAt });
  }

  async reactivateOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);

    if (order.status !== OrderStatus.EXPIRED && order.status !== OrderStatus.ABANDONED) {
      throw new AppError(
        'Only expired or abandoned orders can be reactivated',
        400,
        'INVALID_STATUS'
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ORDER_EXPIRATION_HOURS);

    return this.orderRepository.update(orderId, { status: OrderStatus.DRAFT, expiresAt });
  }

  async markAsAbandoned(orderId: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.DELIVERED) {
      throw new AppError(
        'Cannot mark confirmed or delivered orders as abandoned',
        400,
        'INVALID_STATUS'
      );
    }

    return this.orderRepository.update(orderId, {
      status: OrderStatus.ABANDONED,
      expiresAt: undefined,
    });
  }

  async processExpiredOrders(): Promise<number> {
    return this.orderRepository.markExpiredOrders();
  }

  async deleteOrder(orderId: string, userId: string): Promise<void> {
    await this.getOrderById(orderId, userId);
    await this.orderRepository.delete(orderId);
  }
}
