import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Platform } from '../../integrations/enums';
import { ConversationStatus, MessageSender, EntryMode } from '../enums';
import { Message } from './message.entity';

/**
 * Last message summary for quick access
 */
export interface LastMessageSummary {
  content: string;
  timestamp: Date;
  sender: MessageSender;
}

/**
 * Conversation Entity
 * Represents a unified conversation thread across platforms
 */
@Entity('conversations')
@Index(['userId', 'platform'])
@Index(['userId', 'customerId'])
@Index(['userId', 'updatedAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  customerId?: string;

  @Column({ type: 'varchar', length: 20 })
  platform!: Platform;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  platformConversationId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  platformParticipantId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  participantName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  participantProfilePicture?: string;

  @Column({ type: 'jsonb', nullable: true })
  lastMessage?: LastMessageSummary;

  @Column({ type: 'int', default: 0 })
  unreadCount!: number;

  @Column({ type: 'boolean', default: false })
  hasOrderDetected!: boolean;

  @Column({ type: 'varchar', length: 20, default: ConversationStatus.ACTIVE })
  status!: ConversationStatus;

  @Column({ type: 'varchar', length: 20, default: EntryMode.SYNCED })
  entryMode!: EntryMode;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: object;

  @OneToMany(() => Message, (message) => message.conversation)
  messages?: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
