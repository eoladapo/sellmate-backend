import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CustomerStatus } from '../enums';

/**
 * Platform-specific customer contact information
 */
export interface CustomerPlatformInfo {
  whatsapp?: {
    phoneNumber: string;
    profileName?: string;
  };
  instagram?: {
    username: string;
    profileName?: string;
  };
}

/**
 * Customer order history metrics (updated by order module)
 */
export interface CustomerOrderHistory {
  totalOrders: number;
  completedOrders: number;
  totalValue: number;
  lastOrderDate?: Date;
}

/**
 * Customer Entity
 */
@Entity('customers')
@Index(['userId'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'jsonb', default: {} })
  platforms!: CustomerPlatformInfo;

  @Column({ type: 'jsonb', default: {} })
  orderHistory!: CustomerOrderHistory;

  @Column({ type: 'varchar', length: 20, default: CustomerStatus.ACTIVE })
  status!: CustomerStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  constructor() {
    this.platforms = {};
    this.orderHistory = {
      totalOrders: 0,
      completedOrders: 0,
      totalValue: 0,
    };
    this.status = CustomerStatus.ACTIVE;
  }
}
