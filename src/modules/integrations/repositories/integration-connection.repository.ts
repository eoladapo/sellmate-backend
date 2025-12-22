import { Repository, DataSource, DeepPartial } from 'typeorm';
import { IntegrationConnection, IntegrationConnectionSettings } from '../entities';
import { Platform, ConnectionStatus } from '../enums';

/**
 * Integration Connection Repository
 * Handles database operations for integration connections
 */
export class IntegrationConnectionRepository {
  private repository: Repository<IntegrationConnection>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(IntegrationConnection);
  }

  /**
   * Find connection by user and platform
   */
  async findByUserAndPlatform(
    userId: string,
    platform: Platform
  ): Promise<IntegrationConnection | null> {
    return this.repository.findOne({
      where: { userId, platform },
    });
  }

  /**
   * Find all connections for a user
   */
  async findByUser(userId: string): Promise<IntegrationConnection[]> {
    return this.repository.find({
      where: { userId },
      order: { platform: 'ASC' },
    });
  }

  /**
   * Find all connected integrations for a user
   */
  async findConnectedByUser(userId: string): Promise<IntegrationConnection[]> {
    return this.repository.find({
      where: {
        userId,
        status: ConnectionStatus.CONNECTED,
      },
      order: { platform: 'ASC' },
    });
  }

  /**
   * Create or update connection
   */
  async upsert(data: {
    userId: string;
    platform: Platform;
    status: ConnectionStatus;
    businessAccountId?: string;
    businessAccountName?: string;
    connectedAt?: Date;
    tokenExpiresAt?: Date;
    settings?: IntegrationConnectionSettings;
    metadata?: object;
  }): Promise<IntegrationConnection> {
    const existing = await this.findByUserAndPlatform(data.userId, data.platform);

    if (existing) {
      await this.repository
        .createQueryBuilder()
        .update(IntegrationConnection)
        .set({
          status: data.status,
          businessAccountId: data.businessAccountId,
          businessAccountName: data.businessAccountName,
          connectedAt: data.connectedAt,
          tokenExpiresAt: data.tokenExpiresAt,
          settings: data.settings,
          consecutiveErrors: 0,
          lastError: undefined,
          lastErrorAt: undefined,
        } as DeepPartial<IntegrationConnection>)
        .where('id = :id', { id: existing.id })
        .execute();
      return (await this.repository.findOne({ where: { id: existing.id } }))!;
    }

    const connection = this.repository.create({
      ...data,
      consecutiveErrors: 0,
    });
    return this.repository.save(connection);
  }

  /**
   * Update connection status
   */
  async updateStatus(
    userId: string,
    platform: Platform,
    status: ConnectionStatus,
    error?: string
  ): Promise<void> {
    if (error) {
      await this.repository
        .createQueryBuilder()
        .update(IntegrationConnection)
        .set({
          status,
          lastError: error,
          lastErrorAt: new Date(),
        } as DeepPartial<IntegrationConnection>)
        .where('userId = :userId AND platform = :platform', { userId, platform })
        .execute();
      // Increment consecutive errors
      await this.repository.increment(
        { userId, platform },
        'consecutiveErrors',
        1
      );
    } else {
      const updates: DeepPartial<IntegrationConnection> = { status };
      if (status === ConnectionStatus.CONNECTED) {
        updates.lastError = undefined;
        updates.lastErrorAt = undefined;
        updates.consecutiveErrors = 0;
      }
      await this.repository
        .createQueryBuilder()
        .update(IntegrationConnection)
        .set(updates)
        .where('userId = :userId AND platform = :platform', { userId, platform })
        .execute();
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(
    userId: string,
    platform: Platform,
    cursor?: string
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(IntegrationConnection)
      .set({
        lastSyncAt: new Date(),
        lastSyncCursor: cursor,
        syncInProgress: false,
      } as DeepPartial<IntegrationConnection>)
      .where('userId = :userId AND platform = :platform', { userId, platform })
      .execute();
  }

  /**
   * Set sync in progress
   */
  async setSyncInProgress(
    userId: string,
    platform: Platform,
    inProgress: boolean
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(IntegrationConnection)
      .set({ syncInProgress: inProgress } as DeepPartial<IntegrationConnection>)
      .where('userId = :userId AND platform = :platform', { userId, platform })
      .execute();
  }

  /**
   * Update token expiration
   */
  async updateTokenExpiration(
    userId: string,
    platform: Platform,
    expiresAt: Date
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(IntegrationConnection)
      .set({ tokenExpiresAt: expiresAt } as DeepPartial<IntegrationConnection>)
      .where('userId = :userId AND platform = :platform', { userId, platform })
      .execute();
  }

  /**
   * Update settings
   */
  async updateSettings(
    userId: string,
    platform: Platform,
    settings: Partial<IntegrationConnectionSettings>
  ): Promise<void> {
    const connection = await this.findByUserAndPlatform(userId, platform);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const updatedSettings = {
      ...connection.settings,
      ...settings,
    };

    await this.repository
      .createQueryBuilder()
      .update(IntegrationConnection)
      .set({ settings: updatedSettings } as DeepPartial<IntegrationConnection>)
      .where('userId = :userId AND platform = :platform', { userId, platform })
      .execute();
  }

  /**
   * Delete connection
   */
  async delete(userId: string, platform: Platform): Promise<boolean> {
    const result = await this.repository.delete({ userId, platform });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Find connections with expiring tokens
   */
  async findWithExpiringTokens(hoursUntilExpiry: number = 24): Promise<IntegrationConnection[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setHours(expiryThreshold.getHours() + hoursUntilExpiry);

    return this.repository
      .createQueryBuilder('connection')
      .where('connection.status = :status', { status: ConnectionStatus.CONNECTED })
      .andWhere('connection.tokenExpiresAt IS NOT NULL')
      .andWhere('connection.tokenExpiresAt <= :threshold', { threshold: expiryThreshold })
      .getMany();
  }

  /**
   * Find connections due for sync
   */
  async findDueForSync(): Promise<IntegrationConnection[]> {
    return this.repository
      .createQueryBuilder('connection')
      .where('connection.status = :status', { status: ConnectionStatus.CONNECTED })
      .andWhere('connection.syncInProgress = false')
      .andWhere(
        `(connection.settings->>'autoSync')::boolean = true`
      )
      .andWhere(
        `connection.lastSyncAt IS NULL OR 
         connection.lastSyncAt < NOW() - (connection.settings->>'syncIntervalMinutes')::int * INTERVAL '1 minute'`
      )
      .getMany();
  }

  /**
   * Find connections with errors
   */
  async findWithErrors(): Promise<IntegrationConnection[]> {
    return this.repository.find({
      where: {
        status: ConnectionStatus.ERROR,
      },
    });
  }

  /**
   * Reset error count
   */
  async resetErrorCount(userId: string, platform: Platform): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(IntegrationConnection)
      .set({
        consecutiveErrors: 0,
        lastError: undefined,
        lastErrorAt: undefined,
      } as DeepPartial<IntegrationConnection>)
      .where('userId = :userId AND platform = :platform', { userId, platform })
      .execute();
  }
}
