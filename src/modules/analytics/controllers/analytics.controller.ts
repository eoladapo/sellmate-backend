import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TOKENS } from '../../../di/tokens';
import { AnalyticsService } from '../services/analytics.service';
import { DateRangeQuerySchema, ExportQuerySchema } from '../dto';
import { ReportFormat } from '../enums';
import { successResponse } from '../../../shared/utils/response.util';

@injectable()
export class AnalyticsController {
  constructor(@inject(TOKENS.AnalyticsService) private analyticsService: AnalyticsService) { }

  /**
   * GET /api/v1/analytics/dashboard
   * Get dashboard metrics for date range
   */
  getDashboardMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const query = DateRangeQuerySchema.parse(req.query);
      const metrics = await this.analyticsService.getDashboardMetrics(userId, {
        startDate: query.startDate,
        endDate: query.endDate,
      });

      successResponse(res, metrics, 'Dashboard metrics retrieved');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/revenue
   * Get revenue analytics
   */
  getRevenueAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const query = DateRangeQuerySchema.parse(req.query);
      const revenue = await this.analyticsService.getRevenueAnalytics(userId, {
        startDate: query.startDate,
        endDate: query.endDate,
      });

      successResponse(res, revenue, 'Revenue analytics retrieved');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/customers
   * Get customer analytics
   */
  getCustomerAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const query = DateRangeQuerySchema.parse(req.query);
      const customers = await this.analyticsService.getCustomerAnalytics(userId, {
        startDate: query.startDate,
        endDate: query.endDate,
      });

      successResponse(res, customers, 'Customer analytics retrieved');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/export
   * Export analytics report
   */
  exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const query = ExportQuerySchema.parse(req.query);
      const report = await this.analyticsService.exportReport(userId, {
        format: query.format,
        dateRange: {
          startDate: query.startDate,
          endDate: query.endDate,
        },
        includeOrders: query.includeOrders,
        includeCustomers: query.includeCustomers,
        includeProfit: query.includeProfit,
      });

      if (query.format === ReportFormat.CSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.csv');
        res.send(report);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.json');
        res.send(report);
      }
    } catch (error) {
      next(error);
    }
  };
}
