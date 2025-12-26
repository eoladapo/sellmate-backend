import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TOKENS } from '../../../di/tokens';
import { Platform } from '../enums';
import { WebhookPayload, IWebhookProcessingService } from '../interfaces';
import { WhatsAppIntegrationService } from '../services/whatsapp-integration.service';
import { InstagramIntegrationService } from '../services/instagram-integration.service';

/**
 * Webhook Controller
 * Handles incoming webhooks from WhatsApp and Instagram
 * Requirements: 1.1, 1.2, 6.1, 6.2
 */
@injectable()
export class WebhookController {
  constructor(
    @inject(TOKENS.WebhookProcessingService)
    private webhookProcessingService: IWebhookProcessingService
  ) { }
  /**
   * Handle WhatsApp webhook verification (GET)
   */
  async verifyWhatsAppWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = new WhatsAppIntegrationService();

      const payload: WebhookPayload = {
        platform: Platform.WHATSAPP,
        headers: req.headers as Record<string, string>,
        body: req.query,
      };

      const result = service.verifyWebhook(payload);

      if (result.isValid && result.challenge) {
        res.status(200).send(result.challenge);
      } else {
        res.status(403).json({ error: result.error || 'Verification failed' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle WhatsApp webhook events (POST)
   * Requirements: 1.1, 6.1
   */
  async handleWhatsAppWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const service = new WhatsAppIntegrationService();

      const payload: WebhookPayload = {
        platform: Platform.WHATSAPP,
        headers: req.headers as Record<string, string>,
        body: req.body,
        signature: req.headers['x-hub-signature-256'] as string,
      };

      // Verify webhook signature
      const verification = service.verifyWebhook(payload);
      if (!verification.isValid) {
        res.status(403).json({ error: verification.error || 'Invalid signature' });
        return;
      }

      // Acknowledge receipt immediately (WhatsApp requires quick response)
      res.status(200).send('EVENT_RECEIVED');

      // Process webhook asynchronously
      // Parse messages from the webhook payload
      try {
        const parsedMessages = await service.processWebhook(payload);

        if (parsedMessages.length > 0) {
          // Process messages through WebhookProcessingService
          // This handles seller lookup, message storage, AI analysis, and event emission
          const result = await this.webhookProcessingService.processWebhook(
            Platform.WHATSAPP,
            payload,
            parsedMessages
          );

          console.log(
            `[WebhookController] WhatsApp webhook processed: ${result.messagesStored}/${result.messagesProcessed} messages stored, ${result.ordersDetected} orders detected`
          );

          if (result.errors.length > 0) {
            console.warn('[WebhookController] WhatsApp webhook processing errors:', result.errors);
          }
        }
      } catch (processError) {
        console.error('[WebhookController] Error processing WhatsApp webhook:', processError);
      }
    } catch (error) {
      // Still acknowledge receipt to prevent retries
      res.status(200).send('EVENT_RECEIVED');
      console.error('[WebhookController] WhatsApp webhook error:', error);
    }
  }

  /**
   * Handle Instagram webhook verification (GET)
   */
  async verifyInstagramWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = new InstagramIntegrationService();

      const payload: WebhookPayload = {
        platform: Platform.INSTAGRAM,
        headers: req.headers as Record<string, string>,
        body: req.query,
      };

      const result = service.verifyWebhook(payload);

      if (result.isValid && result.challenge) {
        res.status(200).send(result.challenge);
      } else {
        res.status(403).json({ error: result.error || 'Verification failed' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Instagram webhook events (POST)
   * Requirements: 1.2, 6.2
   */
  async handleInstagramWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const service = new InstagramIntegrationService();

      const payload: WebhookPayload = {
        platform: Platform.INSTAGRAM,
        headers: req.headers as Record<string, string>,
        body: req.body,
        signature: req.headers['x-hub-signature-256'] as string,
      };

      // Verify webhook signature
      const verification = service.verifyWebhook(payload);
      if (!verification.isValid) {
        res.status(403).json({ error: verification.error || 'Invalid signature' });
        return;
      }

      // Acknowledge receipt immediately
      res.status(200).send('EVENT_RECEIVED');

      // Process webhook asynchronously
      // Parse messages from the webhook payload
      try {
        const parsedMessages = await service.processWebhook(payload);

        if (parsedMessages.length > 0) {
          // Process messages through WebhookProcessingService
          // This handles seller lookup, message storage, AI analysis, and event emission
          const result = await this.webhookProcessingService.processWebhook(
            Platform.INSTAGRAM,
            payload,
            parsedMessages
          );

          console.log(
            `[WebhookController] Instagram webhook processed: ${result.messagesStored}/${result.messagesProcessed} messages stored, ${result.ordersDetected} orders detected`
          );

          if (result.errors.length > 0) {
            console.warn('[WebhookController] Instagram webhook processing errors:', result.errors);
          }
        }
      } catch (processError) {
        console.error('[WebhookController] Error processing Instagram webhook:', processError);
      }
    } catch (error) {
      res.status(200).send('EVENT_RECEIVED');
      console.error('[WebhookController] Instagram webhook error:', error);
    }
  }
}
