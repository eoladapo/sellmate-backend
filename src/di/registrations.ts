/**
 * Token Registrations for tsyringe DI Container
 * Registers all interface tokens to their implementation classes
 */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './tokens';

// Auth Module - Repositories
import { UserRepository } from '../modules/auth/repositories/user.repository';
import { OAuthTokenRepository } from '../modules/auth/repositories/oauth-token.repository';
import { OTPVerificationRepository } from '../modules/auth/repositories/otp-verification.repository';
import { AuthSessionRepository } from '../modules/auth/repositories/auth-session.repository';

// Auth Module - Services
import { AuthService } from '../modules/auth/services/auth.service';
import { OTPService } from '../modules/auth/services/otp.service';
import { JWTService } from '../modules/auth/services/jwt.service';
import { OAuthService } from '../shared/services/oauth.service';
import { WhatsAppOAuthService } from '../modules/auth/services/whatsapp-oauth.service';
import { InstagramOAuthService } from '../modules/auth/services/instagram-oauth.service';

// Auth Module - Controllers
import { AuthController } from '../modules/auth/controllers/auth.controller';
import { OAuthController } from '../modules/auth/controllers/oauth.controller';

// Conversations Module - Repositories
import { ConversationRepository } from '../modules/conversations/repositories/conversation.repository';
import { MessageRepository } from '../modules/conversations/repositories/message.repository';

// Conversations Module - Services
import { ConversationService } from '../modules/conversations/services/conversation.service';
import { MessageSyncService } from '../modules/conversations/services/message-sync.service';
import { MessageDeliveryService } from '../modules/conversations/services/message-delivery.service';
import { EventEmitterService } from '../modules/conversations/events/event-emitter.service';

// Conversations Module - Controllers
import { ConversationController } from '../modules/conversations/controllers/conversation.controller';

// Customers Module - Repositories
import { CustomerRepository } from '../modules/customers/repositories/customer.repository';

// Customers Module - Services
import { CustomerService } from '../modules/customers/services/customer.service';

// Customers Module - Controllers
import { CustomerController } from '../modules/customers/controllers/customer.controller';

// Orders Module - Repositories
import { OrderRepository } from '../modules/orders/repositories/order.repository';

// Orders Module - Services
import { OrderService } from '../modules/orders/services/order.service';

// Orders Module - Controllers
import { OrderController } from '../modules/orders/controllers/order.controller';

// Analytics Module - Services
import { AnalyticsService } from '../modules/analytics/services/analytics.service';

// Analytics Module - Controllers
import { AnalyticsController } from '../modules/analytics/controllers/analytics.controller';

// Notifications Module - Repositories
import { NotificationRepository } from '../modules/notifications/repositories/notification.repository';

// Notifications Module - Services
import { NotificationService } from '../modules/notifications/services/notification.service';

// Notifications Module - Controllers
import { NotificationController } from '../modules/notifications/controllers/notification.controller';

// AI Module - Services
import { AIService } from '../modules/ai/services/ai.service';

// AI Module - Controllers
import { AIController } from '../modules/ai/controllers/ai.controller';

// Settings Module - Repositories
import { SettingsRepository } from '../modules/settings/repositories/settings.repository';

// Settings Module - Services
import { SettingsService } from '../modules/settings/services/settings.service';

// Settings Module - Controllers
import { SettingsController } from '../modules/settings/controllers/settings.controller';

// Billing Module - Repositories
import { SubscriptionRepository } from '../modules/billing/repositories/subscription.repository';

// Billing Module - Services
import { SubscriptionService } from '../modules/billing/services/subscription.service';

// Billing Module - Controllers
import { SubscriptionController } from '../modules/billing/controllers/subscription.controller';

// Integrations Module - Repositories
import { IntegrationConnectionRepository } from '../modules/integrations/repositories/integration-connection.repository';

// Integrations Module - Services
import { SellerLookupService } from '../modules/integrations/services/seller-lookup.service';
import { WebhookProcessingService } from '../modules/integrations/services/webhook-processing.service';

// Integrations Module - Controllers
import { IntegrationController } from '../modules/integrations/controllers/integration.controller';
import { WebhookController } from '../modules/integrations/controllers/webhook.controller';

// Shared Services
import { RedisService } from '../shared/services/redis.service';

/**
 * Register all token-to-implementation mappings
 * This function should be called after initializeContainer() to ensure
 * runtime dependencies (DataSource, SMS service) are already registered
 */
export function registerDependencies(): void {
  // ============================================
  // Shared Services
  // ============================================
  container.register(TOKENS.RedisService, { useClass: RedisService });

  // ============================================
  // Auth Module
  // ============================================
  // Repositories
  container.register(TOKENS.UserRepository, { useClass: UserRepository });
  container.register(TOKENS.OAuthTokenRepository, { useClass: OAuthTokenRepository });
  container.register(TOKENS.OTPRepository, { useClass: OTPVerificationRepository });
  container.register(TOKENS.AuthSessionRepository, { useClass: AuthSessionRepository });

  // Services
  container.register(TOKENS.OAuthService, { useClass: OAuthService });
  container.register(TOKENS.JWTService, { useClass: JWTService });
  container.register(TOKENS.OTPService, { useClass: OTPService });
  container.register(TOKENS.AuthService, { useClass: AuthService });
  container.register(TOKENS.WhatsAppOAuthService, { useClass: WhatsAppOAuthService });
  container.register(TOKENS.InstagramOAuthService, { useClass: InstagramOAuthService });

  // Controllers
  container.register(TOKENS.AuthController, { useClass: AuthController });
  container.register(TOKENS.OAuthController, { useClass: OAuthController });

  // ============================================
  // Conversations Module
  // ============================================
  // Repositories
  container.register(TOKENS.ConversationRepository, { useClass: ConversationRepository });
  container.register(TOKENS.MessageRepository, { useClass: MessageRepository });

  // Services
  container.register(TOKENS.ConversationService, { useClass: ConversationService });
  container.register(TOKENS.EventEmitterService, { useClass: EventEmitterService });
  container.register(TOKENS.MessageSyncService, { useClass: MessageSyncService });
  container.register(TOKENS.MessageDeliveryService, { useClass: MessageDeliveryService });

  // Controllers
  container.register(TOKENS.ConversationController, { useClass: ConversationController });

  // ============================================
  // Customers Module
  // ============================================
  // Repositories
  container.register(TOKENS.CustomerRepository, { useClass: CustomerRepository });

  // Services
  container.register(TOKENS.CustomerService, { useClass: CustomerService });

  // Controllers
  container.register(TOKENS.CustomerController, { useClass: CustomerController });

  // ============================================
  // Orders Module
  // ============================================
  // Repositories
  container.register(TOKENS.OrderRepository, { useClass: OrderRepository });

  // Services
  container.register(TOKENS.OrderService, { useClass: OrderService });

  // Controllers
  container.register(TOKENS.OrderController, { useClass: OrderController });

  // ============================================
  // Analytics Module
  // ============================================
  // Services
  container.register(TOKENS.AnalyticsService, { useClass: AnalyticsService });

  // Controllers
  container.register(TOKENS.AnalyticsController, { useClass: AnalyticsController });

  // ============================================
  // Notifications Module
  // ============================================
  // Repositories
  container.register(TOKENS.NotificationRepository, { useClass: NotificationRepository });

  // Services
  container.register(TOKENS.NotificationService, { useClass: NotificationService });

  // Controllers
  container.register(TOKENS.NotificationController, { useClass: NotificationController });

  // ============================================
  // AI Module
  // ============================================
  // Services
  container.register(TOKENS.AIService, { useClass: AIService });

  // Controllers
  container.register(TOKENS.AIController, { useClass: AIController });

  // ============================================
  // Settings Module
  // ============================================
  // Repositories
  container.register(TOKENS.SettingsRepository, { useClass: SettingsRepository });

  // Services
  container.register(TOKENS.SettingsService, { useClass: SettingsService });

  // Controllers
  container.register(TOKENS.SettingsController, { useClass: SettingsController });

  // ============================================
  // Billing Module
  // ============================================
  // Repositories
  container.register(TOKENS.SubscriptionRepository, { useClass: SubscriptionRepository });

  // Services
  container.register(TOKENS.SubscriptionService, { useClass: SubscriptionService });

  // Controllers
  container.register(TOKENS.SubscriptionController, { useClass: SubscriptionController });

  // ============================================
  // Integrations Module
  // ============================================
  // Repositories
  container.register(TOKENS.IntegrationConnectionRepository, { useClass: IntegrationConnectionRepository });

  // Services
  container.register(TOKENS.SellerLookupService, { useClass: SellerLookupService });
  container.register(TOKENS.WebhookProcessingService, { useClass: WebhookProcessingService });

  // Controllers
  container.register(TOKENS.IntegrationController, { useClass: IntegrationController });
  container.register(TOKENS.WebhookController, { useClass: WebhookController });

  console.log('📦 All dependency registrations complete');
}

export { container };
