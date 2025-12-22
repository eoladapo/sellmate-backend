import { injectable, inject } from 'tsyringe';
import { DataSource, Between } from 'typeorm';
import { TOKENS } from '../../../di/tokens';
import { Order } from '../../orders/entities';
import { Customer } from '../../customers/entities';
import { Conversation } from '../../conversations/entities';
import { OrderStatus } from '../../orders/enums';
import { TrendDirection, ReportFormat } from '../enums';
import {
  IAnalyticsService,
  DateRange,
  DashboardMetrics,
  RevenueMetrics,
  CustomerAnalytics,
  ExportOptions,
  RevenueByPlatform,
  ProductProfit,
  OrderMetrics,
  CustomerMetrics,
  ProfitMetrics,
} from '../interfaces';

@injectable()
export class AnalyticsService implements IAnalyticsService {
  constructor(@inject(TOKENS.DataSource) private dataSource: DataSource) { }

  async getDashboardMetrics(userId: string, dateRange: DateRange): Promise<DashboardMetrics> {
    const [revenue, orders, customers, profit] = await Promise.all([
      this.getRevenueAnalytics(userId, dateRange),
      this.getOrderMetrics(userId, dateRange),
      this.getCustomerMetrics(userId, dateRange),
      this.getProfitMetrics(userId, dateRange),
    ]);

    return {
      userId,
      period: dateRange,
      revenue,
      profit,
      orders,
      customers,
    };
  }

  async getRevenueAnalytics(userId: string, dateRange: DateRange): Promise<RevenueMetrics> {
    const orderRepo = this.dataSource.getRepository(Order);
    const conversationRepo = this.dataSource.getRepository(Conversation);

    // Get completed orders in date range
    const orders = await orderRepo.find({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    // Calculate total revenue
    const total = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Get revenue by platform
    const byPlatform: RevenueByPlatform = { whatsapp: 0, instagram: 0, manual: 0 };

    for (const order of orders) {
      if (order.conversationId) {
        const conversation = await conversationRepo.findOne({
          where: { id: order.conversationId },
        });
        if (conversation) {
          if (conversation.platform === 'whatsapp') {
            byPlatform.whatsapp += Number(order.totalAmount);
          } else if (conversation.platform === 'instagram') {
            byPlatform.instagram += Number(order.totalAmount);
          } else {
            byPlatform.manual += Number(order.totalAmount);
          }
        } else {
          byPlatform.manual += Number(order.totalAmount);
        }
      } else {
        byPlatform.manual += Number(order.totalAmount);
      }
    }

    // Calculate previous period for trend
    const periodDuration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStart = new Date(dateRange.startDate.getTime() - periodDuration);
    const previousEnd = new Date(dateRange.startDate.getTime() - 1);

    const previousOrders = await orderRepo.find({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(previousStart, previousEnd),
      },
    });

    const previousPeriodTotal = previousOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const trend = this.calculateTrend(total, previousPeriodTotal);
    const percentageChange =
      previousPeriodTotal > 0
        ? Math.round(((total - previousPeriodTotal) / previousPeriodTotal) * 100 * 100) / 100
        : total > 0
          ? 100
          : 0;

    return {
      total,
      byPlatform,
      trend,
      previousPeriodTotal,
      percentageChange,
    };
  }

  async getCustomerAnalytics(userId: string, dateRange: DateRange): Promise<CustomerAnalytics> {
    const customerRepo = this.dataSource.getRepository(Customer);

    // Get all customers
    const allCustomers = await customerRepo.find({ where: { userId } });
    const totalCustomers = allCustomers.length;

    // Get new customers in date range
    const newCustomers = await customerRepo.count({
      where: {
        userId,
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    // Calculate returning customers (customers with more than 1 order)
    const returningCustomers = allCustomers.filter(
      (c) => c.orderHistory && c.orderHistory.totalOrders > 1
    ).length;

    // Get customers by platform
    const customersByPlatform: RevenueByPlatform = { whatsapp: 0, instagram: 0, manual: 0 };
    for (const customer of allCustomers) {
      if (customer.platforms?.whatsapp) {
        customersByPlatform.whatsapp++;
      }
      if (customer.platforms?.instagram) {
        customersByPlatform.instagram++;
      }
      if (!customer.platforms?.whatsapp && !customer.platforms?.instagram) {
        customersByPlatform.manual++;
      }
    }

    // Get top customers by total spent
    const topCustomers = await Promise.all(
      allCustomers
        .filter((c) => c.orderHistory && c.orderHistory.totalValue > 0)
        .sort((a, b) => (b.orderHistory?.totalValue || 0) - (a.orderHistory?.totalValue || 0))
        .slice(0, 10)
        .map(async (customer) => ({
          customerId: customer.id,
          name: customer.name,
          totalOrders: customer.orderHistory?.totalOrders || 0,
          totalSpent: customer.orderHistory?.totalValue || 0,
        }))
    );

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customersByPlatform,
      topCustomers,
    };
  }

  async exportReport(userId: string, options: ExportOptions): Promise<string> {
    const dashboard = await this.getDashboardMetrics(userId, options.dateRange);

    if (options.format === ReportFormat.CSV) {
      return this.generateCSVReport(dashboard, options);
    }

    return JSON.stringify(dashboard, null, 2);
  }

  calculateTrend(current: number, previous: number): TrendDirection {
    if (previous === 0) {
      return current > 0 ? TrendDirection.INCREASING : TrendDirection.STABLE;
    }

    const percentageChange = ((current - previous) / previous) * 100;

    if (percentageChange > 5) {
      return TrendDirection.INCREASING;
    } else if (percentageChange < -5) {
      return TrendDirection.DECREASING;
    }
    return TrendDirection.STABLE;
  }

  private async getOrderMetrics(userId: string, dateRange: DateRange): Promise<OrderMetrics> {
    const orderRepo = this.dataSource.getRepository(Order);

    const orders = await orderRepo.find({
      where: {
        userId,
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    const total = orders.length;
    const completed = orders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const pending = orders.filter(
      (o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED
    ).length;
    const cancelled = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;
    const expired = orders.filter((o) => o.status === OrderStatus.EXPIRED).length;
    const abandoned = orders.filter((o) => o.status === OrderStatus.ABANDONED).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;

    return {
      total,
      completed,
      pending,
      cancelled,
      expired,
      abandoned,
      completionRate,
    };
  }

  private async getCustomerMetrics(userId: string, dateRange: DateRange): Promise<CustomerMetrics> {
    const customerRepo = this.dataSource.getRepository(Customer);
    const orderRepo = this.dataSource.getRepository(Order);

    const allCustomers = await customerRepo.find({ where: { userId } });
    const total = allCustomers.length;

    const newCustomers = await customerRepo.count({
      where: {
        userId,
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    const returning = allCustomers.filter(
      (c) => c.orderHistory && c.orderHistory.totalOrders > 1
    ).length;

    // High value customers (top 20% by total value)
    const sortedByValue = allCustomers
      .filter((c) => c.orderHistory?.totalValue)
      .sort((a, b) => (b.orderHistory?.totalValue || 0) - (a.orderHistory?.totalValue || 0));
    const highValueThreshold = Math.ceil(sortedByValue.length * 0.2);
    const highValue = highValueThreshold;

    // Calculate average order value
    const completedOrders = await orderRepo.find({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const averageOrderValue =
      completedOrders.length > 0
        ? Math.round((totalRevenue / completedOrders.length) * 100) / 100
        : 0;

    return {
      total,
      new: newCustomers,
      returning,
      highValue,
      averageOrderValue,
    };
  }

  private async getProfitMetrics(userId: string, dateRange: DateRange): Promise<ProfitMetrics> {
    const orderRepo = this.dataSource.getRepository(Order);

    const orders = await orderRepo.find({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    // Calculate total profit
    let totalProfit = 0;
    let totalRevenue = 0;
    const productProfits: Map<string, { profit: number; margin: number; count: number }> =
      new Map();

    for (const order of orders) {
      const profit = order.profit ? Number(order.profit) : 0;
      totalProfit += profit;
      totalRevenue += Number(order.totalAmount);

      // Track by product
      const productName = order.product?.name || 'Unknown';
      const existing = productProfits.get(productName) || { profit: 0, margin: 0, count: 0 };
      existing.profit += profit;
      existing.count += 1;
      productProfits.set(productName, existing);
    }

    // Calculate overall margin
    const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100 * 100) / 100 : 0;

    // Convert product profits to array
    const byProduct: ProductProfit[] = Array.from(productProfits.entries()).map(
      ([productName, data]) => ({
        productName,
        profit: data.profit,
        margin: data.profit > 0 && totalRevenue > 0 ? Math.round((data.profit / totalRevenue) * 100 * 100) / 100 : 0,
        orderCount: data.count,
      })
    );

    // Calculate trend
    const periodDuration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousStart = new Date(dateRange.startDate.getTime() - periodDuration);
    const previousEnd = new Date(dateRange.startDate.getTime() - 1);

    const previousOrders = await orderRepo.find({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(previousStart, previousEnd),
      },
    });

    const previousProfit = previousOrders.reduce(
      (sum, order) => sum + (order.profit ? Number(order.profit) : 0),
      0
    );

    const trend = this.calculateTrend(totalProfit, previousProfit);

    return {
      total: totalProfit,
      margin,
      byProduct,
      trend,
    };
  }

  private generateCSVReport(dashboard: DashboardMetrics, options: ExportOptions): string {
    const lines: string[] = [];

    // Header
    lines.push('SellMate Analytics Report');
    lines.push(`Period: ${dashboard.period.startDate.toISOString()} to ${dashboard.period.endDate.toISOString()}`);
    lines.push('');

    // Revenue section
    lines.push('Revenue Metrics');
    lines.push(`Total Revenue,${dashboard.revenue.total}`);
    lines.push(`WhatsApp Revenue,${dashboard.revenue.byPlatform.whatsapp}`);
    lines.push(`Instagram Revenue,${dashboard.revenue.byPlatform.instagram}`);
    lines.push(`Manual Revenue,${dashboard.revenue.byPlatform.manual}`);
    lines.push(`Trend,${dashboard.revenue.trend}`);
    lines.push('');

    // Profit section
    if (options.includeProfit) {
      lines.push('Profit Metrics');
      lines.push(`Total Profit,${dashboard.profit.total}`);
      lines.push(`Profit Margin,${dashboard.profit.margin}%`);
      lines.push('');
    }

    // Orders section
    if (options.includeOrders) {
      lines.push('Order Metrics');
      lines.push(`Total Orders,${dashboard.orders.total}`);
      lines.push(`Completed,${dashboard.orders.completed}`);
      lines.push(`Pending,${dashboard.orders.pending}`);
      lines.push(`Cancelled,${dashboard.orders.cancelled}`);
      lines.push(`Completion Rate,${dashboard.orders.completionRate}%`);
      lines.push('');
    }

    // Customers section
    if (options.includeCustomers) {
      lines.push('Customer Metrics');
      lines.push(`Total Customers,${dashboard.customers.total}`);
      lines.push(`New Customers,${dashboard.customers.new}`);
      lines.push(`Returning Customers,${dashboard.customers.returning}`);
      lines.push(`High Value Customers,${dashboard.customers.highValue}`);
      lines.push(`Average Order Value,${dashboard.customers.averageOrderValue}`);
    }

    return lines.join('\n');
  }
}
