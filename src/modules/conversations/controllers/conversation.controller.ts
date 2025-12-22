import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service';
import { MessageSyncService } from '../services/message-sync.service';
import { MessageDeliveryService } from '../services/message-delivery.service';
import {
  ListConversationsQueryDto,
  CreateManualConversationDto,
  UpdateConversationDto,
  SendMessageDto,
  AddManualMessageDto,
  TriggerSyncDto,
} from '../dto';
import { Platform, MessageStatus } from '../../integrations/enums';
import { MessageSender, EntryMode } from '../enums';
import { AppError } from '../../../api/middleware/error.middleware';
import { TOKENS } from '../../../di/tokens';

@injectable()
export class ConversationController {
  constructor(
    @inject(TOKENS.ConversationService) private conversationService: ConversationService,
    @inject(TOKENS.MessageSyncService) private messageSyncService: MessageSyncService,
    @inject(TOKENS.MessageDeliveryService) private messageDeliveryService: MessageDeliveryService
  ) {}

  async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as ListConversationsQueryDto;

      const filters = {
        platform: query.platform,
        unreadOnly:
          query.unreadOnly === true || query.unreadOnly === ('true' as unknown as boolean),
        hasOrderDetected:
          query.hasOrderDetected === true ||
          query.hasOrderDetected === ('true' as unknown as boolean),
        customerId: query.customerId,
        search: query.search,
      };

      const pagination = {
        page: parseInt(String(query.page)) || 1,
        limit: Math.min(parseInt(String(query.limit)) || 20, 100),
      };

      const result = await this.conversationService.getConversations(userId, filters, pagination);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await this.conversationService.getConversationWithMessages(
        req.params.id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  async createManualConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateManualConversationDto;

      if (!body.customerName || !body.platform) {
        throw new AppError('Customer name and platform are required', 400, 'VALIDATION_ERROR');
      }

      if (!Object.values(Platform).includes(body.platform)) {
        throw new AppError('Invalid platform', 400, 'INVALID_PLATFORM');
      }

      const conversation = await this.conversationService.createManualConversation({
        userId: req.user!.id,
        customerName: body.customerName,
        customerContact: body.customerContact,
        platform: body.platform,
        notes: body.notes,
      });

      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  async updateConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await this.conversationService.updateConversation(
        req.params.id,
        req.user!.id,
        req.body as UpdateConversationDto
      );
      res.status(200).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const body = req.body as SendMessageDto;

      if (!body.content) {
        throw new AppError('Message content is required', 400, 'VALIDATION_ERROR');
      }

      const conversation = await this.conversationService.getConversationById(
        req.params.id,
        userId
      );

      const message = await this.conversationService.addMessage({
        conversationId: req.params.id,
        content: body.content,
        sender: MessageSender.SELLER,
        platform: conversation.platform,
        timestamp: new Date(),
        entryMode: EntryMode.SYNCED,
      });

      let deliveryResult = null;
      if (conversation.platformParticipantId) {
        deliveryResult = await this.messageDeliveryService.sendMessage(
          userId,
          message,
          conversation.platformParticipantId
        );
      }

      res.status(201).json({
        success: true,
        data: {
          ...message,
          delivery: deliveryResult
            ? {
                sent: deliveryResult.success,
                platformMessageId: deliveryResult.platformMessageId,
                status: deliveryResult.status,
                error: deliveryResult.error,
              }
            : {
                sent: false,
                status: MessageStatus.PENDING,
                error: 'No recipient ID - saved locally',
              },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async addManualMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as AddManualMessageDto;

      if (!body.content || !body.sender) {
        throw new AppError('Message content and sender are required', 400, 'VALIDATION_ERROR');
      }

      if (!Object.values(MessageSender).includes(body.sender)) {
        throw new AppError('Invalid sender', 400, 'INVALID_SENDER');
      }

      const conversation = await this.conversationService.getConversationById(
        req.params.id,
        req.user!.id
      );

      const message = await this.conversationService.addMessage({
        conversationId: req.params.id,
        content: body.content,
        sender: body.sender,
        platform: conversation.platform,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        entryMode: EntryMode.MANUAL,
      });

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.conversationService.markConversationAsRead(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Conversation marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async triggerSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as TriggerSyncDto;

      if (!body.platform || !Object.values(Platform).includes(body.platform)) {
        throw new AppError('Valid platform is required', 400, 'INVALID_PLATFORM');
      }

      const result = await this.messageSyncService.syncPlatform(req.user!.id, body.platform);

      if (!result.success) {
        throw new AppError(result.errors?.[0] || 'Sync failed', 400, 'SYNC_FAILED');
      }

      res.status(202).json({
        success: true,
        message: 'Sync initiated',
        data: {
          messagesProcessed: result.messagesProcessed,
          newMessages: result.newMessages,
          conversationsUpdated: result.conversationsUpdated,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSyncStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statuses = await this.messageSyncService.getAllSyncStatuses(req.user!.id);
      res.status(200).json({ success: true, data: statuses });
    } catch (error) {
      next(error);
    }
  }

  async archiveConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.conversationService.archiveConversation(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Conversation archived' });
    } catch (error) {
      next(error);
    }
  }

  async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.conversationService.deleteConversation(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await this.conversationService.getUnreadCount(req.user!.id);
      res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  }

  async linkCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId } = req.body;
      if (!customerId) {
        throw new AppError('Customer ID is required', 400, 'VALIDATION_ERROR');
      }

      const conversation = await this.conversationService.linkCustomerToConversation(
        req.params.id,
        req.user!.id,
        customerId
      );
      res.status(200).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }
}
