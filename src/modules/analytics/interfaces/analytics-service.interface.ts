import { TrendDirection, ReportFormat } from '../enums';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface RevenueByPlatform {
  whatsapp: number;
  instagram: number;
  manual: number;
}

export interface ProductProfit {
  productName: string;
  profit: number;
  margin: number;
  orderCount: number;
}

export interface RevenueMetrics {
  total: number;
  byPlatform: RevenueByPlatform;
  trend: TrendDirection;
  previousPeriodTotal?: number;
  percentageChange?: number;
}

export interface ProfitMetrics {
  total: number;
  margin: number;
  byProduct: ProductProfit[];
  trend: TrendDirection;
}

export interface OrderMetrics {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  expired: number;
  abandoned: number;
  completionRate: number;
}

export interface CustomerMetrics {
  total: number;
  new: number;
  returning: number;
  highValue: number;
  averageOrderValue: number;
}

export interface DashboardMetrics {
  userId: string;
  period: DateRange;
  revenue: RevenueMetrics;
  profit: ProfitMetrics;
  orders: OrderMetrics;
  customers: CustomerMetrics;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customersByPlatform: RevenueByPlatform;
  topCustomers: Array<{
    customerId: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

export interface ExportOptions {
  format: ReportFormat;
  dateRange: DateRange;
  includeOrders?: boolean;
  includeCustomers?: boolean;
  includeProfit?: boolean;
}

export interface IAnalyticsService {
  getDashboardMetrics(userId: string, dateRange: DateRange): Promise<DashboardMetrics>;
  getRevenueAnalytics(userId: string, dateRange: DateRange): Promise<RevenueMetrics>;
  getCustomerAnalytics(userId: string, dateRange: DateRange): Promise<CustomerAnalytics>;
  exportReport(userId: string, options: ExportOptions): Promise<string>;
  calculateTrend(current: number, previous: number): TrendDirection;
}
