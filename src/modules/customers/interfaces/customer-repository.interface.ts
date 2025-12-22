import { Customer } from '../entities';
import { Platform } from '../../integrations/enums';

export interface CustomerFilters {
  platform?: Platform;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByUser(
    userId: string,
    filters?: CustomerFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Customer>>;
  findByPlatformIdentifier(
    userId: string,
    platform: Platform,
    identifier: string
  ): Promise<Customer | null>;
  create(data: Partial<Customer>): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<boolean>;
}
