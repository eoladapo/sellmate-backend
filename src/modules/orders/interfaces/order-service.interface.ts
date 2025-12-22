import { Order } from '../entities';
import { OrderStatus } from '../enums';
import { OrderFilters, PaginationOptions, PaginatedResult } from './order-repository.interface';

export interface CreateOrderRequest {
  userId: string;
  customerId?: string;
  conversationId?: string;
  sourceMessageId?: string;
  product: { name: string; quantity: number; sellingPrice: number; costPrice?: number };
  customer: { name: string; contact: string; deliveryAddress?: string };
  notes?: string;
}

export interface UpdateOrderRequest {
  product?: { name?: string; quantity?: number; sellingPrice?: number; costPrice?: number };
  customer?: { name?: string; contact?: string; deliveryAddress?: string };
  notes?: string;
}

export interface IOrderService {
  getOrders(
    userId: string,
    filters?: OrderFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Order>>;
  getOrderById(orderId: string, userId: string): Promise<Order>;
  getOrdersByCustomer(userId: string, customerId: string): Promise<Order[]>;
  getAbandonedOrders(userId: string): Promise<Order[]>;
  getExpiredOrders(userId: string): Promise<Order[]>;
  createOrder(request: CreateOrderRequest): Promise<Order>;
  updateOrder(orderId: string, userId: string, updates: UpdateOrderRequest): Promise<Order>;
  updateOrderStatus(orderId: string, userId: string, status: OrderStatus): Promise<Order>;
  reactivateOrder(orderId: string, userId: string): Promise<Order>;
  markAsAbandoned(orderId: string, userId: string): Promise<Order>;
  processExpiredOrders(): Promise<number>;
  deleteOrder(orderId: string, userId: string): Promise<void>;
}
