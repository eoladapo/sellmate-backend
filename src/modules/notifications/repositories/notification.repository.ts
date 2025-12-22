import { injectable, inject } from 'tsyringe';
import { Repository, DataSource, LessThan } from 'typeorm';
import { TOKENS } from '../../../di/tokens';
import { Notification } from '../entities';
import {
  INotificationRepository,
  NotificationFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';

@injectable()
export class NotificationRepository implements INotificationRepository {
  private repository: Repository<Notification>;

  constructor(@inject(TOKENS.DataSource) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUser(
    userId: string,
    filters?: NotificationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;
    if (filters?.status) where.status = filters.status;

    const [data, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.repository.count({
      where: { userId, isRead: false },
    });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.repository.create(data);
    return this.repository.save(notification);
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    await this.repository.update(id, data as any);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Notification ${id} not found`);
    return updated;
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { isRead: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.repository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result.affected ?? 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteOlderThan(userId: string, date: Date): Promise<number> {
    const result = await this.repository.delete({
      userId,
      createdAt: LessThan(date),
    });
    return result.affected ?? 0;
  }
}
