import { Platform } from '../../integrations/enums';

export interface ListCustomersQueryDto {
  platform?: Platform;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerDto {
  name: string;
  phoneNumber?: string;
  platforms?: {
    whatsapp?: { phoneNumber: string; profileName?: string };
    instagram?: { username: string; profileName?: string };
  };
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phoneNumber?: string;
  notes?: string;
}
