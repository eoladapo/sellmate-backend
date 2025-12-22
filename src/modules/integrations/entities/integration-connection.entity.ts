import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Platform, ConnectionStatus } from '../enums';

/**
 * Integration Connection Entity
 * Tracks the connection status and sync state for each platform integration
 */
@Entity('integration_connections')
@Index(['userId', 'platform'], { unique: true })
export class IntegrationConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  platform!: Platform;

  @Column({ type: 'varchar', length: 20, default: ConnectionStatus.DISCONNECTED })
  status!: ConnectionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  businessAccountId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  businessAccountName?: string;

  @Column({ type: 'timestamp', nullable: true })
  connectedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastSyncCursor?: string;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastErrorAt?: Date;

  @Column({ type: 'int', default: 0 })
  consecutiveErrors!: number;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'boolean', default: false })
  syncInProgress!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings?: IntegrationConnectionSettings;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: object;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Integration connection settings
 */
export interface IntegrationConnectionSettings {
  autoSync: boolean;
  syncIntervalMinutes: number;
  syncComments?: boolean;
  notifyOnNewMessage: boolean;
  notifyOnStatusChange: boolean;
}
