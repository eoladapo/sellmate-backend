import { Twilio } from 'twilio';
import { ISMSService } from './otp.service';
import { appConfig } from '../../../config/app.config';

/**
 * Twilio Verify Service - Uses Twilio's Verify API for OTP
 * This works globally including Nigeria on trial accounts
 */
export class TwilioVerifyService implements ISMSService {
  private client: Twilio;
  private verifyServiceSid: string;

  constructor() {
    const { accountSid, authToken, verifyServiceSid } = appConfig.sms.twilio;

    if (!accountSid || !authToken || !verifyServiceSid) {
      throw new Error('Twilio Verify credentials not configured');
    }

    this.verifyServiceSid = verifyServiceSid;
    this.client = new Twilio(accountSid, authToken);
  }

  async sendSMS(phoneNumber: string, _message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Twilio Verify sends its own OTP, we ignore the message parameter
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      console.log(`Twilio Verify sent to ${phoneNumber}, status: ${verification.status}`);

      return {
        success: verification.status === 'pending',
        messageId: verification.sid,
      };
    } catch (error) {
      console.error('Twilio Verify error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Twilio Verify error',
      };
    }
  }

  /**
   * Verify the OTP code sent by Twilio Verify
   */
  async verifyCode(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      return {
        success: verificationCheck.status === 'approved',
        error: verificationCheck.status !== 'approved' ? 'Invalid or expired code' : undefined,
      };
    } catch (error) {
      console.error('Twilio Verify check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }
}

/**
 * Legacy Twilio SMS Service - Uses regular SMS API
 * Note: May not work for international numbers on trial accounts
 */
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

  async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
export class MockSMSService implements ISMSService {
  async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // In development, just log the OTP instead of sending SMS
    console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }
}