import 'reflect-metadata';
import { Container } from 'typedi';
import { DataSource } from 'typeorm';
import { appConfig } from './config/app.config';

// Import services and repositories
import { OAuthService } from './shared/services/oauth.service';
import { WhatsAppOAuthService } from './modules/auth/services/whatsapp-oauth.service';
import { InstagramOAuthService } from './modules/auth/services/instagram-oauth.service';
import { OAuthTokenRepository } from './modules/auth/repositories/oauth-token.repository';
import { UserRepository } from './modules/auth/repositories/user.repository';
import { OTPVerificationRepository } from './modules/auth/repositories/otp-verification.repository';
import { AuthSessionRepository } from './modules/auth/repositories/auth-session.repository';
import { TwilioVerifyService, TwilioSMSService, MockSMSService } from './modules/auth/services/sms.service';
import { RedisService } from './shared/services/redis.service';
import { OAuthController } from './modules/auth/controllers/oauth.controller';
import { AuthController } from './modules/auth/controllers/auth.controller';
import { AuthService } from './modules/auth/services/auth.service';
import { OTPService } from './modules/auth/services/otp.service';
import { JWTService } from './modules/auth/services/jwt.service';

// Import conversation services and repositories
import { ConversationRepository } from './modules/conversations/repositories/conversation.repository';
import { MessageRepository } from './modules/conversations/repositories/message.repository';
import { ConversationService } from './modules/conversations/services/conversation.service';
import { MessageSyncService } from './modules/conversations/services/message-sync.service';
import { MessageDeliveryService } from './modules/conversations/services/message-delivery.service';
import { ConversationController } from './modules/conversations/controllers/conversation.controller';
import { IntegrationConnectionRepository } from './modules/integrations/repositories/integration-connection.repository';

// Import customer services and repositories
import { CustomerRepository } from './modules/customers/repositories/customer.repository';
import { CustomerService } from './modules/customers/services/customer.service';
import { CustomerController } from './modules/customers/controllers/customer.controller';

// Import order services and repositories
import { OrderRepository } from './modules/orders/repositories/order.repository';
import { OrderService } from './modules/orders/services/order.service';
import { OrderController } from './modules/orders/controllers/order.controller';

// Import analytics services and controllers
import { AnalyticsService } from './modules/analytics/services/analytics.service';
import { AnalyticsController } from './modules/analytics/controllers/analytics.controller';

// Import notification services and controllers
import { NotificationRepository } from './modules/notifications/repositories/notification.repository';
import { NotificationService } from './modules/notifications/services/notification.service';
import { NotificationController } from './modules/notifications/controllers/notification.controller';

// Import AI services and controllers
import { AIService } from './modules/ai/services/ai.service';
import { AIController } from './modules/ai/controllers/ai.controller';

// Import settings services and controllers
import { SettingsRepository } from './modules/settings/repositories/settings.repository';
import { SettingsService } from './modules/settings/services/settings.service';
import { SettingsController } from './modules/settings/controllers/settings.controller';

// Import billing services and controllers
import { SubscriptionRepository } from './modules/billing/repositories/subscription.repository';
import { SubscriptionService } from './modules/billing/services/subscription.service';
import { BillingService } from './modules/billing/services/billing.service';
import { SubscriptionController } from './modules/billing/controllers/subscription.controller';

// Import integration controller
import { IntegrationController } from './modules/integrations/controllers/integration.controller';

// Import interfaces
import { IOAuthService } from './modules/auth/interfaces/oauth-service.interface';
import { IOAuthTokenRepository } from './modules/auth/interfaces/oauth-token-repository.interface';
import { IOTPRepository } from './modules/auth/interfaces/otp-repository.interface';
import { IAuthSessionRepository } from './modules/auth/interfaces/auth-session-repository.interface';
import { IUserRepository } from './modules/auth/interfaces/user-repository.interface';
import { IAuthService } from './modules/auth/interfaces/auth-service.interface';
import { IOTPService } from './modules/auth/interfaces/otp-service.interface';
import { IJWTService } from './modules/auth/interfaces/jwt-service.interface';
import { IConversationRepository } from './modules/conversations/interfaces/conversation-repository.interface';
import { IMessageRepository } from './modules/conversations/interfaces/message-repository.interface';
import { IConversationService } from './modules/conversations/interfaces/conversation-service.interface';
import { IMessageSyncService } from './modules/conversations/interfaces/message-sync-service.interface';

// Import customer interfaces
import { ICustomerRepository } from './modules/customers/interfaces/customer-repository.interface';
import { ICustomerService } from './modules/customers/interfaces/customer-service.interface';

// Import order interfaces
import { IOrderRepository } from './modules/orders/interfaces/order-repository.interface';
import { IOrderService } from './modules/orders/interfaces/order-service.interface';

/**
 * Dependency Injection Container
 * Manages service dependencies and lifecycle
 */

/**
 * Initialize and configure the DI container
 */
export function initializeContainer(dataSource: DataSource): void {
  // Register repositories
  Container.set<IOAuthTokenRepository>('OAuthTokenRepository', new OAuthTokenRepository(dataSource));
  Container.set<IUserRepository>('UserRepository', new UserRepository(dataSource));
  Container.set<IOTPRepository>('OTPRepository', new OTPVerificationRepository(dataSource));
  Container.set<IAuthSessionRepository>('AuthSessionRepository', new AuthSessionRepository(dataSource));

  // Register shared services
  Container.set('RedisService', new RedisService());

  // Register SMS service
  // Priority: Twilio Verify > Twilio SMS > Mock
  const twilioVerifyConfigured = appConfig.sms.twilio.accountSid &&
    appConfig.sms.twilio.authToken &&
    appConfig.sms.twilio.verifyServiceSid;

  const twilioSmsConfigured = appConfig.sms.twilio.accountSid &&
    appConfig.sms.twilio.authToken &&
    appConfig.sms.twilio.phoneNumber;

  let smsService;
  if (twilioVerifyConfigured) {
    console.log('📱 Using Twilio Verify service (recommended for OTP)');
    smsService = new TwilioVerifyService();
  } else if (twilioSmsConfigured) {
    console.log('📱 Using Twilio SMS service');
    smsService = new TwilioSMSService();
  } else {
    console.log('📱 Using Mock SMS service (Twilio not configured)');
    smsService = new MockSMSService();
  }
  Container.set('SMSService', smsService);

  // Register OAuth service
  Container.set<IOAuthService>('OAuthService', new OAuthService());

  // Register OAuth platform services
  Container.set('WhatsAppOAuthService', new WhatsAppOAuthService(
    Container.get<IOAuthService>('OAuthService'),
    Container.get<IOAuthTokenRepository>('OAuthTokenRepository'),
    Container.get<IUserRepository>('UserRepository')
  ));

  Container.set('InstagramOAuthService', new InstagramOAuthService(
    Container.get<IOAuthService>('OAuthService'),
    Container.get<IOAuthTokenRepository>('OAuthTokenRepository'),
    Container.get<IUserRepository>('UserRepository')
  ));

  // Register core auth services (these need to be registered before platform services)
  Container.set<IJWTService>('JWTService', new JWTService(
    Container.get<IAuthSessionRepository>('AuthSessionRepository'),
    Container.get('RedisService')
  ));
  Container.set<IOTPService>('OTPService', new OTPService(
    Container.get<IOTPRepository>('OTPRepository'),
    Container.get('SMSService')
  ));
  Container.set<IAuthService>('AuthService', new AuthService(
    Container.get<IUserRepository>('UserRepository'),
    Container.get<IOTPService>('OTPService'),
    Container.get<IJWTService>('JWTService')
  ));

  // Register controllers
  Container.set('AuthController', new AuthController(
    Container.get<IAuthService>('AuthService')
  ));

  Container.set('OAuthController', new OAuthController(
    Container.get('WhatsAppOAuthService'),
    Container.get('InstagramOAuthService')
  ));

  // Register conversation repositories
  Container.set<IConversationRepository>('ConversationRepository', new ConversationRepository(dataSource));
  Container.set<IMessageRepository>('MessageRepository', new MessageRepository(dataSource));
  Container.set('IntegrationConnectionRepository', new IntegrationConnectionRepository(dataSource));

  // Register conversation services
  Container.set<IConversationService>('ConversationService', new ConversationService(
    Container.get<IConversationRepository>('ConversationRepository') as ConversationRepository,
    Container.get<IMessageRepository>('MessageRepository') as MessageRepository
  ));

  Container.set<IMessageSyncService>('MessageSyncService', new MessageSyncService(
    Container.get<IConversationRepository>('ConversationRepository') as ConversationRepository,
    Container.get<IMessageRepository>('MessageRepository') as MessageRepository,
    Container.get('IntegrationConnectionRepository') as IntegrationConnectionRepository
  ));

  // Register message delivery service
  Container.set('MessageDeliveryService', new MessageDeliveryService(dataSource));

  // Register conversation controller
  Container.set('ConversationController', new ConversationController(
    Container.get<IConversationService>('ConversationService') as ConversationService,
    Container.get<IMessageSyncService>('MessageSyncService') as MessageSyncService,
    Container.get('MessageDeliveryService') as MessageDeliveryService
  ));

  // Register customer repository
  Container.set<ICustomerRepository>('CustomerRepository', new CustomerRepository(dataSource));

  // Register customer service
  Container.set<ICustomerService>('CustomerService', new CustomerService(
    Container.get<ICustomerRepository>('CustomerRepository') as CustomerRepository
  ));

  // Register customer controller
  Container.set('CustomerController', new CustomerController(
    Container.get<ICustomerService>('CustomerService') as CustomerService
  ));

  // Register order repository
  Container.set<IOrderRepository>('OrderRepository', new OrderRepository(dataSource));

  // Register order service
  Container.set<IOrderService>('OrderService', new OrderService(
    Container.get<IOrderRepository>('OrderRepository') as OrderRepository
  ));

  // Register order controller
  Container.set('OrderController', new OrderController(
    Container.get<IOrderService>('OrderService') as OrderService
  ));

  // Register analytics service
  Container.set('AnalyticsService', new AnalyticsService(dataSource));

  // Register analytics controller
  Container.set('AnalyticsController', new AnalyticsController(
    Container.get('AnalyticsService') as AnalyticsService
  ));

  // Register notification repository
  Container.set('NotificationRepository', new NotificationRepository(dataSource));

  // Register notification service
  Container.set('NotificationService', new NotificationService(
    Container.get('NotificationRepository') as NotificationRepository,
    Container.get('SMSService')
  ));

  // Register notification controller
  Container.set('NotificationController', new NotificationController(
    Container.get('NotificationService') as NotificationService
  ));

  // Register AI service
  Container.set('AIService', new AIService());

  // Register AI controller
  Container.set('AIController', new AIController(
    Container.get('AIService') as AIService
  ));

  // Register settings repository
  Container.set('SettingsRepository', new SettingsRepository(dataSource));

  // Register settings service
  Container.set('SettingsService', new SettingsService(
    Container.get('SettingsRepository') as SettingsRepository
  ));

  // Register settings controller
  Container.set('SettingsController', new SettingsController(
    Container.get('SettingsService') as SettingsService
  ));

  // Register subscription repository
  Container.set('SubscriptionRepository', new SubscriptionRepository(dataSource));

  // Register subscription service
  Container.set('SubscriptionService', new SubscriptionService(
    Container.get('SubscriptionRepository') as SubscriptionRepository
  ));

  // Register billing service
  Container.set('BillingService', new BillingService(
    Container.get('SubscriptionRepository') as SubscriptionRepository
  ));

  // Register subscription controller
  Container.set('SubscriptionController', new SubscriptionController(
    Container.get('SubscriptionService') as SubscriptionService,
    Container.get('BillingService') as BillingService
  ));

  // Register integration controller
  Container.set('IntegrationController', new IntegrationController(dataSource));

  console.log('📦 Dependency injection container initialized');
}

/**
 * Get service from container
 */
export function getService<T>(token: string): T {
  return Container.get<T>(token);
}

export default Container;
