import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Platform, MessageType, MessageStatus } from '../../integrations/enums';
import { MessageSender, EntryMode } from '../enums';
import { Conversation } from './conversation.entity';

/**
 * AI analysis result for a message
 */
export interface MessageAIAnalysis {
  orderDetected: boolean;
  extractedDetails?: {
    productName?: string;
    quantity?: number;
    price?: number;
    deliveryAddress?: string;
    customerName?: string;
  };
  confidenceScore: number;
  customerIntent?: 'inquiry' | 'purchase' | 'complaint' | 'support';
  analyzedAt?: Date;
}

/**
 * Message metadata for additional platform-specific data
 */
export interface MessageMetadata {
  mediaUrl?: string;
  mediaCaption?: string;
  replyToMessageId?: string;
  whatsappMessageType?: string;
  instagramMessageType?: string;
}

/**
 * Message Entity
 * Represents a single message within a conversation
 */
@Entity('messages')
@Index(['conversationId', 'timestamp'])
@Index(['conversationId', 'sender'])
@Index(['platformMessageId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 20 })
  sender!: MessageSender;

  @Column({ type: 'varchar', length: 20 })
  platform!: Platform;

  @Column({ type: 'varchar', length: 255, nullable: true })
  platformMessageId?: string;

  @Column({ type: 'varchar', length: 20, default: MessageType.TEXT })
  messageType!: MessageType;

  @Column({ type: 'varchar', length: 20, default: MessageStatus.DELIVERED })
  status!: MessageStatus;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp!: Date;

  @Column({ type: 'jsonb', nullable: true })
  aiAnalysis?: MessageAIAnalysis;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: MessageMetadata;

  @Column({ type: 'varchar', length: 20, default: EntryMode.SYNCED })
  entryMode!: EntryMode;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation?: Conversation;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
