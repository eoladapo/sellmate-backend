import { injectable, inject } from 'tsyringe';
import { Repository, DataSource, Between } from 'typeorm';
import { TOKENS } from '../../../di/tokens';
import { BusinessMetrics } from '../entities';
import { DateRange } from '../interfaces';

export interface IAnalyticsRepository {
  findByUserAndPeriod(userId: string, dateRange: DateRange): Promise<BusinessMetrics | null>;
  create(data: Partial<BusinessMetrics>): Promise<BusinessMetrics>;
  update(id: string, data: Partial<BusinessMetrics>): Promise<BusinessMetrics>;
}

@injectable()
export class AnalyticsRepository implements IAnalyticsRepository {
  private repository: Repository<BusinessMetrics>;

  constructor(@inject(TOKENS.DataSource) private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(BusinessMetrics);
  }

  async findByUserAndPeriod(userId: string, dateRange: DateRange): Promise<BusinessMetrics | null> {
    return this.repository.findOne({
      where: {
        userId,
        periodStart: dateRange.startDate,
        periodEnd: dateRange.endDate,
      },
    });
  }

  async findByUserInRange(userId: string, dateRange: DateRange): Promise<BusinessMetrics[]> {
    return this.repository.find({
      where: {
        userId,
        periodStart: Between(dateRange.startDate, dateRange.endDate),
      },
      order: { periodStart: 'DESC' },
    });
  }

  async create(data: Partial<BusinessMetrics>): Promise<BusinessMetrics> {
    const metrics = this.repository.create(data);
    return this.repository.save(metrics);
  }

  async update(id: string, data: Partial<BusinessMetrics>): Promise<BusinessMetrics> {
    await this.repository.update(id, data);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) throw new Error(`BusinessMetrics ${id} not found`);
    return updated;
  }
}
