import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('oauth_tokens')
@Index(['userId', 'platform'], { unique: true })
export class OAuthToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  platform!: 'whatsapp' | 'instagram';

  @Column({ type: 'text' })
  encryptedAccessToken!: string;

  @Column({ type: 'text', nullable: true })
  encryptedRefreshToken?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  businessAccountId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  businessAccountName?: string;

  @Column({ type: 'text', nullable: true })
  scope?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}