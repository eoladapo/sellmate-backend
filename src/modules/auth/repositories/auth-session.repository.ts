import { Repository, DataSource, LessThan } from 'typeorm';
import { AuthSession } from '../entities/auth-session.entity';
import { IAuthSessionRepository } from '../interfaces/auth-session-repository.interface';

export class AuthSessionRepository implements IAuthSessionRepository {
  private repository: Repository<AuthSession>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(AuthSession);
  }

  async findById(id: string): Promise<AuthSession | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByIdWithUser(id: string): Promise<AuthSession | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByRefreshTokenHash(tokenHash: string): Promise<AuthSession | null> {
    return this.repository.findOne({
      where: { refreshTokenHash: tokenHash, isRevoked: false },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<AuthSession[]> {
    return this.repository.find({
      where: { userId, isRevoked: false },
      order: { createdAt: 'DESC' },
    });
  }

  async create(sessionData: Partial<AuthSession>): Promise<AuthSession> {
    const session = this.repository.create(sessionData);
    return this.repository.save(session);
  }

  async update(id: string, sessionData: Partial<AuthSession>): Promise<AuthSession> {
    await this.repository.update(id, sessionData);
    const updatedSession = await this.findById(id);
    if (!updatedSession) {
      throw new Error(`Auth session with id ${id} not found`);
    }
    return updatedSession;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.repository.delete({ userId });
    return result.affected ?? 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }

  async revokeSession(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isRevoked: true });
    return (result.affected ?? 0) > 0;
  }
}