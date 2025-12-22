import { Repository, DataSource, DeepPartial } from 'typeorm';
import { Message, MessageAIAnalysis } from '../entities';
import {
  IMessageRepository,
  MessageFilters,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { Platform, MessageStatus } from '../../integrations/enums';

/**
 * Message Repository
 * Handles database operations for messages
 */
export class MessageRepository implements IMessageRepository {
  private repository: Repository<Message>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Message);
  }

  async findById(id: string): Promise<Message | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByPlatformMessageId(
    platform: Platform,
    platformMessageId: string
  ): Promise<Message | null> {
    return this.repository.findOne({
      where: { platform, platformMessageId },
    });
  }

  async findByConversation(
    conversationId: string,
    filters?: MessageFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Message>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId });

    // Apply filters
    if (filters?.sender) {
      queryBuilder.andWhere('message.sender = :sender', {
        sender: filters.sender,
      });
    }

    if (filters?.platform) {
      queryBuilder.andWhere('message.platform = :platform', {
        platform: filters.platform,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('message.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.hasAIAnalysis !== undefined) {
      if (filters.hasAIAnalysis) {
        queryBuilder.andWhere('message.aiAnalysis IS NOT NULL');
      } else {
        queryBuilder.andWhere('message.aiAnalysis IS NULL');
      }
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('message.timestamp >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('message.timestamp <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering (oldest first for chat display)
    const data = await queryBuilder
      .orderBy('message.timestamp', 'ASC')
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

  async findRecentByConversation(
    conversationId: string,
    limit: number = 50
  ): Promise<Message[]> {
    return this.repository.find({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async create(data: Partial<Message>): Promise<Message> {
    const message = this.repository.create(data);
    return this.repository.save(message);
  }

  async createMany(data: Partial<Message>[]): Promise<Message[]> {
    const messages = this.repository.create(data);
    return this.repository.save(messages);
  }

  async update(id: string, data: Partial<Message>): Promise<Message> {
    await this.repository.update(id, data as DeepPartial<Message>);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Message with id ${id} not found`);
    }
    return updated;
  }

  async updateStatus(id: string, status: MessageStatus): Promise<void> {
    await this.repository.update(id, { status });
  }

  async updateAIAnalysis(id: string, analysis: MessageAIAnalysis): Promise<void> {
    await this.repository.update(id, { aiAnalysis: analysis } as DeepPartial<Message>);
  }

  async markAsRead(id: string): Promise<void> {
    await this.repository.update(id, { isRead: true });
  }

  async markAllAsReadInConversation(conversationId: string): Promise<number> {
    const result = await this.repository.update(
      { conversationId, isRead: false },
      { isRead: true }
    );
    return result.affected ?? 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countByConversation(conversationId: string): Promise<number> {
    return this.repository.count({ where: { conversationId } });
  }

  async countUnreadByConversation(conversationId: string): Promise<number> {
    return this.repository.count({
      where: { conversationId, isRead: false },
    });
  }

  async existsByPlatformMessageId(
    platform: Platform,
    platformMessageId: string
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: { platform, platformMessageId },
    });
    return count > 0;
  }

  async findLatestByConversation(conversationId: string): Promise<Message | null> {
    return this.repository.findOne({
      where: { conversationId },
      order: { timestamp: 'DESC' },
    });
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Message[]> {
    return this.repository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .where('conversation.userId = :userId', { userId })
      .andWhere('message.timestamp >= :startDate', { startDate })
      .andWhere('message.timestamp <= :endDate', { endDate })
      .orderBy('message.timestamp', 'ASC')
      .getMany();
  }
}
