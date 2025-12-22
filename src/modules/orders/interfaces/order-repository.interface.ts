import { Order } from '../entities';
import { OrderStatus } from '../enums';

export interface OrderFilters {
  status?: OrderStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUser(userId: string, filters?: OrderFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Order>>;
  findByCustomer(userId: string, customerId: string): Promise<Order[]>;
  findExpiredOrders(userId: string): Promise<Order[]>;
  findAbandonedOrders(userId: string): Promise<Order[]>;
  create(data: Partial<Order>): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
  delete(id: string): Promise<boolean>;
  markExpiredOrders(): Promise<number>;
}
