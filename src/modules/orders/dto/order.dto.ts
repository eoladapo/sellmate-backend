import { OrderStatus } from '../enums';

export interface ListOrdersQueryDto {
  status?: OrderStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateOrderDto {
  customerId?: string;
  conversationId?: string;
  sourceMessageId?: string;
  product: { name: string; quantity: number; sellingPrice: number; costPrice?: number };
  customer: { name: string; contact: string; deliveryAddress?: string };
  notes?: string;
}

export interface UpdateOrderDto {
  product?: { name?: string; quantity?: number; sellingPrice?: number; costPrice?: number };
  customer?: { name?: string; contact?: string; deliveryAddress?: string };
  notes?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface ReactivateOrderDto {
  orderId: string;
}
