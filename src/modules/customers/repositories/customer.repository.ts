import { Repository, DataSource, Brackets } from 'typeorm';
import { Customer } from '../entities';
import {
  ICustomerRepository,
  CustomerFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { Platform } from '../../integrations/enums';

export class CustomerRepository implements ICustomerRepository {
  private repository: Repository<Customer>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Customer);
  }

  async findById(id: string): Promise<Customer | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUser(
    userId: string,
    filters?: CustomerFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Customer>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.repository
      .createQueryBuilder('customer')
      .where('customer.userId = :userId', { userId });

    if (filters?.platform === Platform.WHATSAPP) {
      qb.andWhere("customer.platforms->>'whatsapp' IS NOT NULL");
    } else if (filters?.platform === Platform.INSTAGRAM) {
      qb.andWhere("customer.platforms->>'instagram' IS NOT NULL");
    }

    if (filters?.search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('customer.name ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('customer.phoneNumber ILIKE :search', { search: `%${filters.search}%` });
        })
      );
    }

    const total = await qb.getCount();
    const data = await qb.orderBy('customer.updatedAt', 'DESC').skip(skip).take(limit).getMany();

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByPlatformIdentifier(
    userId: string,
    platform: Platform,
    identifier: string
  ): Promise<Customer | null> {
    const qb = this.repository
      .createQueryBuilder('customer')
      .where('customer.userId = :userId', { userId });

    if (platform === Platform.WHATSAPP) {
      qb.andWhere("customer.platforms->'whatsapp'->>'phoneNumber' = :identifier", { identifier });
    } else if (platform === Platform.INSTAGRAM) {
      qb.andWhere("customer.platforms->'instagram'->>'username' = :identifier", { identifier });
    }

    return qb.getOne();
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const customer = this.repository.create(data);
    return this.repository.save(customer);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Customer ${id} not found`);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
