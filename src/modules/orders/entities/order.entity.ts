import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OrderStatus } from '../enums';

export interface OrderProduct {
  name: string;
  quantity: number;
  sellingPrice: number;
  costPrice?: number;
}

export interface OrderCustomerInfo {
  name: string;
  contact: string;
  deliveryAddress?: string;
}

@Entity('orders')
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  customerId?: string;

  @Column({ type: 'uuid', nullable: true })
  conversationId?: string;

  @Column({ type: 'uuid', nullable: true })
  sourceMessageId?: string;

  @Column({ type: 'varchar', length: 20, default: OrderStatus.DRAFT })
  status!: OrderStatus;

  @Column({ type: 'jsonb' })
  product!: OrderProduct;

  @Column({ type: 'jsonb' })
  customer!: OrderCustomerInfo;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  profit?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  @Index()
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
