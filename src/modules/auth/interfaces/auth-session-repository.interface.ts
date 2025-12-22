import { AuthSession } from '../entities/auth-session.entity';

export interface IAuthSessionRepository {
  findById(id: string): Promise<AuthSession | null>;
  findByIdWithUser(id: string): Promise<AuthSession | null>;
  findByRefreshTokenHash(tokenHash: string): Promise<AuthSession | null>;
  findByUserId(userId: string): Promise<AuthSession[]>;
  create(sessionData: Partial<AuthSession>): Promise<AuthSession>;
  update(id: string, sessionData: Partial<AuthSession>): Promise<AuthSession>;
  delete(id: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<number>;
  deleteExpired(): Promise<number>;
  revokeSession(id: string): Promise<boolean>;
}
