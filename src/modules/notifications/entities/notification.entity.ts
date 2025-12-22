import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../enums';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 20, default: NotificationChannel.IN_APP })
  channel!: NotificationChannel;

  @Column({ type: 'varchar', length: 20, default: NotificationPriority.MEDIUM })
  priority!: NotificationPriority;

  @Column({ type: 'varchar', length: 20, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Column({ type: 'jsonb' })
  payload!: NotificationPayload;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedEntityType?: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
