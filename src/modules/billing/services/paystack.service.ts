import { injectable } from 'tsyringe';
import { appConfig } from '../../../config/app.config';

/**
 * Paystack API response types
 */
export interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  id: number;
  domain: string;
  status: 'success' | 'failed' | 'abandoned';
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: Record<string, unknown>;
  fees: number;
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
  };
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
    account_name: string | null;
  };
  plan: unknown;
}

export interface PaystackChargeData {
  amount: number;
  transaction_date: string;
  status: 'success' | 'failed';
  reference: string;
  domain: string;
  currency: string;
  channel: string;
  gateway_response: string;
}

export interface PaystackCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: Record<string, unknown>;
  risk_action: string;
}

export interface PaystackSubscriptionData {
  customer: number;
  plan: number;
  integration: number;
  domain: string;
  start: number;
  status: string;
  quantity: number;
  amount: number;
  subscription_code: string;
  email_token: string;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
  };
  next_payment_date: string;
}

export interface PaystackPlanData {
  id: number;
  name: string;
  plan_code: string;
  description: string | null;
  amount: number;
  interval: string;
  currency: string;
}

/**
 * Paystack service for payment processing
 */
@injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor() {
    this.secretKey = appConfig.paystack?.secretKey || '';
    if (!this.secretKey && appConfig.isProduction) {
      console.warn('⚠️ Paystack secret key not configured');
    }
  }

  /**
   * Check if Paystack is configured
   */
  isConfigured(): boolean {
    return !!this.secretKey;
  }

  /**
   * Initialize a transaction
   */
  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    metadata?: Record<string, unknown>,
    callbackUrl?: string
  ): Promise<PaystackInitializeData> {
    const response = await this.makeRequest<PaystackInitializeData>('/transaction/initialize', 'POST', {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      reference,
      metadata,
      callback_url: callbackUrl,
    });

    return response.data;
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyData> {
    const response = await this.makeRequest<PaystackVerifyData>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      'GET'
    );

    return response.data;
  }

  /**
   * Charge an authorization (for recurring payments)
   */
  async chargeAuthorization(
    email: string,
    amount: number,
    authorizationCode: string,
    reference: string,
    metadata?: Record<string, unknown>
  ): Promise<PaystackChargeData> {
    const response = await this.makeRequest<PaystackChargeData>('/transaction/charge_authorization', 'POST', {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      authorization_code: authorizationCode,
      reference,
      metadata,
    });

    return response.data;
  }

  /**
   * Create or get a customer
   */
  async createCustomer(
    email: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    metadata?: Record<string, unknown>
  ): Promise<PaystackCustomer> {
    const response = await this.makeRequest<PaystackCustomer>('/customer', 'POST', {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      metadata,
    });

    return response.data;
  }

  /**
   * Get customer by email
   */
  async getCustomer(emailOrCode: string): Promise<PaystackCustomer> {
    const response = await this.makeRequest<PaystackCustomer>(
      `/customer/${encodeURIComponent(emailOrCode)}`,
      'GET'
    );

    return response.data;
  }

  /**
   * Create a subscription plan
   */
  async createPlan(
    name: string,
    amount: number,
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'annually',
    description?: string
  ): Promise<PaystackPlanData> {
    const response = await this.makeRequest<PaystackPlanData>('/plan', 'POST', {
      name,
      amount: amount * 100, // Paystack expects amount in kobo
      interval,
      description,
    });

    return response.data;
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerEmail: string,
    planCode: string,
    authorizationCode: string,
    startDate?: string
  ): Promise<PaystackSubscriptionData> {
    const response = await this.makeRequest<PaystackSubscriptionData>('/subscription', 'POST', {
      customer: customerEmail,
      plan: planCode,
      authorization: authorizationCode,
      start_date: startDate,
    });

    return response.data;
  }

  /**
   * Disable a subscription
   */
  async disableSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
    await this.makeRequest('/subscription/disable', 'POST', {
      code: subscriptionCode,
      token: emailToken,
    });
  }

  /**
   * Enable a subscription
   */
  async enableSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
    await this.makeRequest('/subscription/enable', 'POST', {
      code: subscriptionCode,
      token: emailToken,
    });
  }

  /**
   * List banks for bank transfer
   */
  async listBanks(country: string = 'nigeria'): Promise<Array<{ name: string; code: string }>> {
    const response = await this.makeRequest<Array<{ name: string; code: string }>>(
      `/bank?country=${country}`,
      'GET'
    );

    return response.data;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', this.secretKey).update(payload).digest('hex');
    return hash === signature;
  }

  /**
   * Generate a unique reference
   */
  generateReference(prefix: string = 'SM'): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
  }

  /**
   * Make HTTP request to Paystack API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: Record<string, unknown>
  ): Promise<PaystackResponse<T>> {
    if (!this.secretKey) {
      throw new Error('Paystack is not configured. Please set PAYSTACK_SECRET_KEY environment variable.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = (await response.json()) as PaystackResponse<T> & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || `Paystack API error: ${response.status}`);
      }

      return data as PaystackResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Paystack request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
