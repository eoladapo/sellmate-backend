import { injectable } from 'tsyringe';
import { Twilio } from 'twilio';
import { ISMSService } from './otp.service';
import { appConfig } from '../../../config/app.config';

/**
 * Legacy Twilio SMS Service - Uses regular SMS API
 * Note: May not work for international numbers on trial accounts
 */

@injectable()
export class TwilioSMSService implements ISMSService {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const { accountSid, authToken, phoneNumber } = appConfig.sms.twilio;

    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    this.fromNumber = phoneNumber;
    this.client = new Twilio(accountSid, authToken);
  }

  async sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
      };
    }
  }
}

// Mock SMS service for development/testing
@injectable()
export class MockSMSService implements ISMSService {
  async sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // In development, just log the OTP instead of sending SMS
    console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }
}
