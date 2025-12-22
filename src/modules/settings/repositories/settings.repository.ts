import { Repository, DataSource } from 'typeorm';
import { UserSettings } from '../entities';
import { ISettingsRepository } from '../interfaces';

/**
 * Settings repository implementation
 */
export class SettingsRepository implements ISettingsRepository {
  private repository: Repository<UserSettings>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserSettings);
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async create(userId: string, data?: Partial<UserSettings>): Promise<UserSettings> {
    const settings = this.repository.create({
      userId,
      ...data,
    });
    return this.repository.save(settings);
  }

  async update(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new Error(`Settings not found for user ${userId}`);
    }

    // Merge the data
    const updated = this.repository.merge(existing, data);
    return this.repository.save(updated);
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId });
    return (result.affected ?? 0) > 0;
  }

  async getOrCreate(userId: string): Promise<UserSettings> {
    let settings = await this.findByUserId(userId);
    if (!settings) {
      settings = await this.create(userId);
    }
    return settings;
  }
}
