import { injectable, inject } from 'tsyringe';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { Conversation, LastMessageSummary } from '../entities';
import {
  IConversationRepository,
  ConversationFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { Platform } from '../../integrations/enums';
import { ConversationStatus, MessageSender } from '../enums';
import { TOKENS } from '../../../di/tokens';

/**
 * Conversation Repository
 * Handles database operations for conversations
 */
@injectable()
export class ConversationRepository implements IConversationRepository {
  private repository: Repository<Conversation>;

  constructor(@inject(TOKENS.DataSource) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Conversation);
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithMessages(id: string, messageLimit: number = 50): Promise<Conversation | null> {
    return this.repository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'message')
      .where('conversation.id = :id', { id })
      .orderBy('message.timestamp', 'DESC')
      .take(messageLimit)
      .getOne();
  }

  async findByUserAndPlatformId(
    userId: string,
    platform: Platform,
    platformConversationId: string
  ): Promise<Conversation | null> {
    return this.repository.findOne({
      where: { userId, platform, platformConversationId },
    });
  }

  async findByUser(
    userId: string,
    filters?: ConversationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Conversation>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('conversation')
      .where('conversation.userId = :userId', { userId });

    // Apply filters
    if (filters?.platform) {
      queryBuilder.andWhere('conversation.platform = :platform', {
        platform: filters.platform,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('conversation.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.unreadOnly) {
      queryBuilder.andWhere('conversation.unreadCount > 0');
    }

    if (filters?.hasOrderDetected !== undefined) {
      queryBuilder.andWhere('conversation.hasOrderDetected = :hasOrder', {
        hasOrder: filters.hasOrderDetected,
      });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('conversation.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.entryMode) {
      queryBuilder.andWhere('conversation.entryMode = :entryMode', {
        entryMode: filters.entryMode,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(conversation.participantName ILIKE :search OR conversation.notes ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const data = await queryBuilder
      .orderBy('conversation.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCustomer(userId: string, customerId: string): Promise<Conversation[]> {
    return this.repository.find({
      where: { userId, customerId },
      order: { updatedAt: 'DESC' },
    });
  }

  async create(data: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.repository.create(data);
    return this.repository.save(conversation);
  }

  async update(id: string, data: Partial<Conversation>): Promise<Conversation> {
    await this.repository.update(id, data as DeepPartial<Conversation>);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    return updated;
  }

  async updateUnreadCount(id: string, count: number): Promise<void> {
    await this.repository.update(id, { unreadCount: count });
  }

  async incrementUnreadCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'unreadCount', 1);
  }

  async markAsRead(id: string): Promise<void> {
    await this.repository.update(id, { unreadCount: 0 });
  }

  async updateLastMessage(
    id: string,
    content: string,
    sender: 'customer' | 'seller',
    timestamp: Date
  ): Promise<void> {
    const lastMessage: LastMessageSummary = {
      content: content.substring(0, 200), // Truncate for summary
      timestamp,
      sender: sender as MessageSender,
    };
    await this.repository.update(id, {
      lastMessage,
      updatedAt: timestamp,
    } as DeepPartial<Conversation>);
  }

  async setOrderDetected(id: string, detected: boolean): Promise<void> {
    await this.repository.update(id, { hasOrderDetected: detected });
  }

  async archive(id: string): Promise<void> {
    await this.repository.update(id, { status: ConversationStatus.ARCHIVED });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countByUser(userId: string, filters?: ConversationFilters): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('conversation')
      .where('conversation.userId = :userId', { userId });

    if (filters?.platform) {
      queryBuilder.andWhere('conversation.platform = :platform', {
        platform: filters.platform,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('conversation.status = :status', {
        status: filters.status,
      });
    }

    return queryBuilder.getCount();
  }

  async countUnreadByUser(userId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('conversation')
      .select('SUM(conversation.unreadCount)', 'total')
      .where('conversation.userId = :userId', { userId })
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }
}
