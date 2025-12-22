import { Repository, DataSource } from 'typeorm';
import { OAuthToken } from '../entities/oauth-token.entity';
import { IOAuthTokenRepository } from '../interfaces/oauth-token-repository.interface';

export class OAuthTokenRepository implements IOAuthTokenRepository {
  private repository: Repository<OAuthToken>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(OAuthToken);
  }

  async findByUserAndPlatform(userId: string, platform: 'whatsapp' | 'instagram'): Promise<OAuthToken | null> {
    return this.repository.findOne({
      where: {
        userId,
        platform,
        isActive: true,
      },
    });
  }

  async upsert(tokenData: {
    userId: string;
    platform: 'whatsapp' | 'instagram';
    encryptedAccessToken: string;
    encryptedRefreshToken?: string;
    businessAccountId?: string;
    businessAccountName?: string;
    scope?: string;
    expiresAt?: Date;
  }): Promise<OAuthToken> {
    // First, deactivate any existing tokens for this user/platform
    await this.repository.update(
      {
        userId: tokenData.userId,
        platform: tokenData.platform,
      },
      {
        isActive: false,
      }
    );

    // Create new token
    const token = this.repository.create({
      ...tokenData,
      isActive: true,
    });

    return this.repository.save(token);
  }

  async update(id: string, updates: Partial<OAuthToken>): Promise<OAuthToken | null> {
    await this.repository.update(id, updates);
    return this.repository.findOne({ where: { id } });
  }

  async delete(userId: string, platform: 'whatsapp' | 'instagram'): Promise<boolean> {
    const result = await this.repository.delete({
      userId,
      platform,
    });

    return (result.affected ?? 0) > 0;
  }

  async findActiveTokensByUser(userId: string): Promise<OAuthToken[]> {
    return this.repository.find({
      where: {
        userId,
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async deactivate(userId: string, platform: 'whatsapp' | 'instagram'): Promise<boolean> {
    const result = await this.repository.update(
      {
        userId,
        platform,
      },
      {
        isActive: false,
      }
    );

    return (result.affected ?? 0) > 0;
  }
}