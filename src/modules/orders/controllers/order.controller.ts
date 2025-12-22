import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { ListOrdersQueryDto, CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from '../dto';
import { OrderStatus } from '../enums';
import { AppError } from '../../../api/middleware/error.middleware';

export class OrderController {
  constructor(private orderService: OrderService) { }

  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListOrdersQueryDto;
      const result = await this.orderService.getOrders(
        req.user!.id,
        {
          status: query.status,
          customerId: query.customerId,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        },
        { page: parseInt(String(query.page)) || 1, limit: Math.min(parseInt(String(query.limit)) || 20, 100) }
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await this.orderService.getOrderById(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await this.orderService.getOrdersByCustomer(req.user!.id, req.params.customerId);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getAbandonedOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await this.orderService.getAbandonedOrders(req.user!.id);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getExpiredOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await this.orderService.getExpiredOrders(req.user!.id);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateOrderDto;
      if (!body.product?.name || !body.product?.quantity || !body.product?.sellingPrice) {
        throw new AppError('Product name, quantity, and sellingPrice are required', 400, 'VALIDATION_ERROR');
      }
      if (!body.customer?.name || !body.customer?.contact) {
        throw new AppError('Customer name and contact are required', 400, 'VALIDATION_ERROR');
      }

      const order = await this.orderService.createOrder({ userId: req.user!.id, ...body });
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await this.orderService.updateOrder(req.params.id, req.user!.id, req.body as UpdateOrderDto);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body as UpdateOrderStatusDto;
      if (!status || !Object.values(OrderStatus).includes(status)) {
        throw new AppError('Valid status is required', 400, 'VALIDATION_ERROR');
      }
      const order = await this.orderService.updateOrderStatus(req.params.id, req.user!.id, status);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async reactivateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await this.orderService.reactivateOrder(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async markAsAbandoned(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await this.orderService.markAsAbandoned(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.orderService.deleteOrder(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
