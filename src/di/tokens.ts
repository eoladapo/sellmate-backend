/**
 * Symbol-based tokens for dependency injection
 * These tokens provide type-safe dependency resolution with tsyringe
 */

export const TOKENS = {
  // Infrastructure
  DataSource: Symbol('DataSource'),
  RedisService: Symbol('RedisService'),

  // Auth Module - Repositories
  UserRepository: Symbol('IUserRepository'),
  OAuthTokenRepository: Symbol('IOAuthTokenRepository'),
  OTPRepository: Symbol('IOTPRepository'),
  AuthSessionRepository: Symbol('IAuthSessionRepository'),

  // Auth Module - Services
  AuthService: Symbol('IAuthService'),
  OTPService: Symbol('IOTPService'),
  JWTService: Symbol('IJWTService'),
  SMSService: Symbol('ISMSService'),
  OAuthService: Symbol('IOAuthService'),
  WhatsAppOAuthService: Symbol('WhatsAppOAuthService'),
  InstagramOAuthService: Symbol('InstagramOAuthService'),

  // Auth Module - Controllers
  AuthController: Symbol('AuthController'),
  OAuthController: Symbol('OAuthController'),

  // Conversations Module - Repositories
  ConversationRepository: Symbol('IConversationRepository'),
  MessageRepository: Symbol('IMessageRepository'),

  // Conversations Module - Services
  ConversationService: Symbol('IConversationService'),
  MessageSyncService: Symbol('IMessageSyncService'),
  MessageDeliveryService: Symbol('MessageDeliveryService'),
  EventEmitterService: Symbol('IMessageEventEmitter'),

  // Conversations Module - Controllers
  ConversationController: Symbol('ConversationController'),

  // Customers Module - Repositories
  CustomerRepository: Symbol('ICustomerRepository'),

  // Customers Module - Services
  CustomerService: Symbol('ICustomerService'),

  // Customers Module - Controllers
  CustomerController: Symbol('CustomerController'),

  // Orders Module - Repositories
  OrderRepository: Symbol('IOrderRepository'),

  // Orders Module - Services
  OrderService: Symbol('IOrderService'),

  // Orders Module - Controllers
  OrderController: Symbol('OrderController'),

  // Analytics Module - Services
  AnalyticsService: Symbol('AnalyticsService'),

  // Analytics Module - Controllers
  AnalyticsController: Symbol('AnalyticsController'),

  // Notifications Module - Repositories
  NotificationRepository: Symbol('NotificationRepository'),

  // Notifications Module - Services
  NotificationService: Symbol('NotificationService'),

  // Notifications Module - Controllers
  NotificationController: Symbol('NotificationController'),

  // AI Module - Services
  AIService: Symbol('AIService'),

  // AI Module - Controllers
  AIController: Symbol('AIController'),

  // Settings Module - Repositories
  SettingsRepository: Symbol('SettingsRepository'),

  // Settings Module - Services
  SettingsService: Symbol('SettingsService'),

  // Settings Module - Controllers
  SettingsController: Symbol('SettingsController'),

  // Billing Module - Repositories
  SubscriptionRepository: Symbol('SubscriptionRepository'),

  // Billing Module - Services
  SubscriptionService: Symbol('SubscriptionService'),

  // Billing Module - Controllers
  SubscriptionController: Symbol('SubscriptionController'),

  // Integrations Module - Repositories
  IntegrationConnectionRepository: Symbol('IntegrationConnectionRepository'),

  // Integrations Module - Services
  SellerLookupService: Symbol('ISellerLookupService'),
  WebhookProcessingService: Symbol('IWebhookProcessingService'),

  // Integrations Module - Controllers
  IntegrationController: Symbol('IntegrationController'),
  WebhookController: Symbol('WebhookController'),
} as const;

// Type helper for token keys
export type TokenKey = keyof typeof TOKENS;
