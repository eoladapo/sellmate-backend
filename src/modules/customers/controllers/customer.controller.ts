import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { ListCustomersQueryDto, CreateCustomerDto, UpdateCustomerDto } from '../dto';
import { AppError } from '../../../api/middleware/error.middleware';
import { TOKENS } from '../../../di/tokens';

@injectable()
export class CustomerController {
  constructor(@inject(TOKENS.CustomerService) private customerService: CustomerService) {}

  async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as ListCustomersQueryDto;

      const result = await this.customerService.getCustomers(
        userId,
        { platform: query.platform, search: query.search },
        {
          page: parseInt(String(query.page)) || 1,
          limit: Math.min(parseInt(String(query.limit)) || 20, 100),
        }
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await this.customerService.getCustomerById(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateCustomerDto;
      if (!body.name) {
        throw new AppError('Customer name is required', 400, 'VALIDATION_ERROR');
      }

      const customer = await this.customerService.createCustomer({
        userId: req.user!.id,
        name: body.name,
        phoneNumber: body.phoneNumber,
        platforms: body.platforms,
        notes: body.notes,
      });
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await this.customerService.updateCustomer(
        req.params.id,
        req.user!.id,
        req.body as UpdateCustomerDto
      );
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.customerService.deleteCustomer(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getCustomerInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const insights = await this.customerService.getCustomerInsights(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: insights });
    } catch (error) {
      next(error);
    }
  }
}
