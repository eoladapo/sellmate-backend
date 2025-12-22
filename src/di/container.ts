/**
 * tsyringe DI Container Setup
 * Handles runtime/conditional registrations that cannot be done via decorators
 */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { DataSource } from 'typeorm';
import { TOKENS } from './tokens';
import { appConfig } from '../config/app.config';
import {
  TwilioVerifyService,
  TwilioSMSService,
  MockSMSService,
} from '../modules/auth/services/sms.service';
import { registerDependencies } from './registrations';

/**
 * Initialize the DI container with runtime dependencies
 * @param dataSource - TypeORM DataSource instance for database access
 */
export function initializeContainer(dataSource: DataSource): void {
  // Register DataSource as singleton value for all repositories
  container.register(TOKENS.DataSource, { useValue: dataSource });

  // Register SMS service based on configuration
  // Priority: Twilio Verify > Twilio SMS > Mock
  const twilioVerifyConfigured =
    appConfig.sms.twilio.accountSid &&
    appConfig.sms.twilio.authToken &&
    appConfig.sms.twilio.verifyServiceSid;

  const twilioSmsConfigured =
    appConfig.sms.twilio.accountSid &&
    appConfig.sms.twilio.authToken &&
    appConfig.sms.twilio.phoneNumber;

  if (twilioVerifyConfigured) {
    console.log('📱 Using Twilio Verify service (recommended for OTP)');
    container.register(TOKENS.SMSService, { useClass: TwilioVerifyService });
  } else if (twilioSmsConfigured) {
    console.log('📱 Using Twilio SMS service');
    container.register(TOKENS.SMSService, { useClass: TwilioSMSService });
  } else {
    console.log('📱 Using Mock SMS service (Twilio not configured)');
    container.register(TOKENS.SMSService, { useClass: MockSMSService });
  }

  // Register all token-to-implementation mappings
  registerDependencies();

  console.log('📦 Dependency injection container initialized');
}

export { container };
