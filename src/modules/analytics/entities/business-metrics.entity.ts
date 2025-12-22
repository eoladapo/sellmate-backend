import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TrendDirection } from '../enums';

export interface RevenueByPlatformData {
  whatsapp: number;
  instagram: number;
  manual: number;
}

export interface ProductProfitData {
  productName: string;
  profit: number;
  margin: number;
  orderCount: number;
}

export interface RevenueData {
  total: number;
  byPlatform: RevenueByPlatformData;
  trend: TrendDirection;
}

export interface ProfitData {
  total: number;
  margin: number;
  byProduct: ProductProfitData[];
}

export interface OrdersData {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  expired: number;
  abandoned: number;
  completionRate: number;
}

export interface CustomersData {
  total: number;
  new: number;
  returning: number;
  highValue: number;
}

@Entity('business_metrics')
@Index(['userId', 'periodStart', 'periodEnd'])
export class BusinessMetrics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'timestamp', name: 'period_start' })
  periodStart!: Date;

  @Column({ type: 'timestamp', name: 'period_end' })
  periodEnd!: Date;

  @Column({ type: 'jsonb' })
  revenue!: RevenueData;

  @Column({ type: 'jsonb' })
  profit!: ProfitData;

  @Column({ type: 'jsonb' })
  orders!: OrdersData;

  @Column({ type: 'jsonb' })
  customers!: CustomersData;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
