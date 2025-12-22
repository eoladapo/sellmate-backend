import { Request, Response, NextFunction } from 'express';
import { Platform } from '../enums';
import { WebhookPayload } from '../interfaces';
import { WhatsAppIntegrationService } from '../services/whatsapp-integration.service';
import { InstagramIntegrationService } from '../services/instagram-integration.service';

/**
 * Webhook Controller
 * Handles incoming webhooks from WhatsApp and Instagram
 */
export class WebhookController {
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
      // In production, this should be queued for processing
      try {
        const messages = await service.processWebhook(payload);

        // TODO: Store messages in database and trigger notifications
        console.log(`Processed ${messages.length} WhatsApp messages`);

        // Emit events for real-time updates
        // eventEmitter.emit('whatsapp:messages', messages);
      } catch (processError) {
        console.error('Error processing WhatsApp webhook:', processError);
      }
    } catch (error) {
      // Still acknowledge receipt to prevent retries
      res.status(200).send('EVENT_RECEIVED');
      console.error('WhatsApp webhook error:', error);
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
      try {
        const messages = await service.processWebhook(payload);

        // TODO: Store messages in database and trigger notifications
        console.log(`Processed ${messages.length} Instagram messages`);

        // Emit events for real-time updates
        // eventEmitter.emit('instagram:messages', messages);
      } catch (processError) {
        console.error('Error processing Instagram webhook:', processError);
      }
    } catch (error) {
      res.status(200).send('EVENT_RECEIVED');
      console.error('Instagram webhook error:', error);
    }
  }
}
