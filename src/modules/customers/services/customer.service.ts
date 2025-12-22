import { injectable, inject } from 'tsyringe';
import { Customer, CustomerPlatformInfo } from '../entities';
import { CustomerRepository } from '../repositories/customer.repository';
import {
  ICustomerService,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerInsights,
  CustomerFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { CustomerStatus } from '../enums';
import { Platform } from '../../integrations/enums';
import { AppError } from '../../../api/middleware/error.middleware';
import { TOKENS } from '../../../di/tokens';

@injectable()
export class CustomerService implements ICustomerService {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepository: CustomerRepository) {}

  async getCustomers(
    userId: string,
    filters?: CustomerFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Customer>> {
    return this.customerRepository.findByUser(userId, filters, pagination);
  }

  async getCustomerById(customerId: string, userId: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer || customer.userId !== userId) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }
    return customer;
  }

  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    return this.customerRepository.create({
      userId: request.userId,
      name: request.name,
      phoneNumber: request.phoneNumber,
      platforms: request.platforms || {},
      notes: request.notes,
      status: CustomerStatus.ACTIVE,
      orderHistory: { totalOrders: 0, completedOrders: 0, totalValue: 0 },
    });
  }

  async updateCustomer(
    customerId: string,
    userId: string,
    updates: UpdateCustomerRequest
  ): Promise<Customer> {
    await this.getCustomerById(customerId, userId); // Verify ownership
    return this.customerRepository.update(customerId, {
      name: updates.name,
      phoneNumber: updates.phoneNumber,
      notes: updates.notes,
    });
  }

  async deleteCustomer(customerId: string, userId: string): Promise<void> {
    await this.getCustomerById(customerId, userId); // Verify ownership
    await this.customerRepository.delete(customerId);
  }

  async getCustomerInsights(customerId: string, userId: string): Promise<CustomerInsights> {
    const customer = await this.getCustomerById(customerId, userId);
    return {
      customerId: customer.id,
      orderHistory: customer.orderHistory,
      platforms: {
        whatsapp: !!customer.platforms?.whatsapp,
        instagram: !!customer.platforms?.instagram,
      },
    };
  }

  async findOrCreateByPlatform(
    userId: string,
    platform: Platform,
    identifier: string,
    profileName?: string
  ): Promise<Customer> {
    const existing = await this.customerRepository.findByPlatformIdentifier(
      userId,
      platform,
      identifier
    );
    if (existing) return existing;

    const platforms: CustomerPlatformInfo = {};
    if (platform === Platform.WHATSAPP) {
      platforms.whatsapp = { phoneNumber: identifier, profileName };
    } else if (platform === Platform.INSTAGRAM) {
      platforms.instagram = { username: identifier, profileName };
    }

    return this.createCustomer({
      userId,
      name: profileName || identifier,
      platforms,
    });
  }
}
