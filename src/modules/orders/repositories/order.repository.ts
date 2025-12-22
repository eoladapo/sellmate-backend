import { injectable, inject } from 'tsyringe';
import {
  Repository,
  DataSource,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
  LessThan,
} from 'typeorm';
import { Order } from '../entities';
import { OrderStatus } from '../enums';
import { IOrderRepository, OrderFilters, PaginationOptions, PaginatedResult } from '../interfaces';
import { TOKENS } from '../../../di/tokens';

@injectable()
export class OrderRepository implements IOrderRepository {
  private repository: Repository<Order>;

  constructor(@inject(TOKENS.DataSource) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUser(
    userId: string,
    filters?: OrderFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Order>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters?.startDate) {
      where.createdAt = MoreThanOrEqual(filters.startDate);
    } else if (filters?.endDate) {
      where.createdAt = LessThanOrEqual(filters.endDate);
    }

    const [data, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findByCustomer(userId: string, customerId: string): Promise<Order[]> {
    return this.repository.find({ where: { userId, customerId }, order: { createdAt: 'DESC' } });
  }

  async findExpiredOrders(userId: string): Promise<Order[]> {
    return this.repository.find({
      where: { userId, status: OrderStatus.EXPIRED },
      order: { createdAt: 'DESC' },
    });
  }

  async findAbandonedOrders(userId: string): Promise<Order[]> {
    return this.repository.find({
      where: { userId, status: OrderStatus.ABANDONED },
      order: { createdAt: 'DESC' },
    });
  }

  async markExpiredOrders(): Promise<number> {
    const now = new Date();
    const result = await this.repository.update(
      {
        status: In([OrderStatus.DRAFT, OrderStatus.PENDING]),
        expiresAt: LessThan(now),
      },
      { status: OrderStatus.EXPIRED }
    );
    return result.affected ?? 0;
  }

  async create(data: Partial<Order>): Promise<Order> {
    const order = this.repository.create(data);
    return this.repository.save(order);
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Order ${id} not found`);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
