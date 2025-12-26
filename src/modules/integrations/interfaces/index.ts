// Integration service interfaces
export {
  IIntegrationService,
  IIntegrationServiceFactory,
} from './integration-service.interface';

// Seller lookup interfaces
export {
  ISellerLookupService,
  SellerInfo,
} from './seller-lookup-service.interface';

// Webhook processing interfaces
export {
  IWebhookProcessingService,
  WebhookProcessingResult,
  MessageProcessingResult,
  ProcessingError,
} from './webhook-processing-service.interface';

// Configuration interfaces
export {
  IntegrationConfig,
  IntegrationSettings,
  IntegrationStatus,
  IntegrationHealthCheck,
  RateLimitInfo,
} from './integration-config.interface';

// Message interfaces
export {
  IntegrationMessage,
  MessageMetadata,
  SendMessageRequest,
  SendMessageResponse,
} from './integration-message.interface';

// Webhook interfaces
export {
  WebhookPayload,
  WebhookVerificationResult,
  WebhookEvent,
  WebhookEventData,
  WebhookConfig,
  WebhookRegistrationResult,
} from './webhook.interface';

// Sync interfaces
export {
  SyncOptions,
  SyncResult,
  SyncedConversation,
  SyncError,
  SyncState,
  SyncScheduleConfig,
} from './sync.interface';
