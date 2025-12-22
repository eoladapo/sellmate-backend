import { Customer, CustomerOrderHistory } from '../entities';
import {
  CustomerFilters,
  PaginationOptions,
  PaginatedResult,
} from './customer-repository.interface';
import { Platform } from '../../integrations/enums';

export interface CreateCustomerRequest {
  userId: string;
  name: string;
  phoneNumber?: string;
  platforms?: {
    whatsapp?: { phoneNumber: string; profileName?: string };
    instagram?: { username: string; profileName?: string };
  };
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phoneNumber?: string;
  notes?: string;
}

export interface CustomerInsights {
  customerId: string;
  orderHistory: CustomerOrderHistory;
  platforms: {
    whatsapp: boolean;
    instagram: boolean;
  };
}

export interface ICustomerService {
  getCustomers(
    userId: string,
    filters?: CustomerFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Customer>>;
  getCustomerById(customerId: string, userId: string): Promise<Customer>;
  createCustomer(request: CreateCustomerRequest): Promise<Customer>;
  updateCustomer(
    customerId: string,
    userId: string,
    updates: UpdateCustomerRequest
  ): Promise<Customer>;
  deleteCustomer(customerId: string, userId: string): Promise<void>;
  getCustomerInsights(customerId: string, userId: string): Promise<CustomerInsights>;
  findOrCreateByPlatform(
    userId: string,
    platform: Platform,
    identifier: string,
    profileName?: string
  ): Promise<Customer>;
}
