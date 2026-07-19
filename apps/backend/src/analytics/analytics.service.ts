import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { LogRequestDto } from './dto/log-request.dto';
import { Analytics } from './entities/analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private analyticsRepository: Repository<Analytics>,
  ) {}

  private getDateFromPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24h
    }
  }

  async logRequest(data: LogRequestDto): Promise<void> {
    const analytics = this.analyticsRepository.create({
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isAuthenticated: data.isAuthenticated,
    });
    await this.analyticsRepository.save(analytics);
  }

  async getOverview(period: string = '24h') {
    const startDate = this.getDateFromPeriod(period);

    const [
      totalRequests,
      uniqueVisitors,
      peakTrafficResult,
      topEndpointResult,
      responseTimeResult,
    ] = await Promise.all([
      this.analyticsRepository.count({ where: { timestamp: MoreThanOrEqual(startDate) } }),
      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(DISTINCT COALESCE("analytics"."userId"::text, "analytics"."ipAddress"))', 'count')
        .where('analytics.timestamp >= :startDate', { startDate })
        .getRawOne(),
      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select("DATE_TRUNC('hour', analytics.timestamp)", 'hour')
        .addSelect('COUNT(*)', 'count')
        .where('analytics.timestamp >= :startDate', { startDate })
        .groupBy("DATE_TRUNC('hour', analytics.timestamp)")
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne(),
      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('analytics.endpoint', 'endpoint')
        .addSelect('analytics.method', 'method')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(analytics.responseTime)', 'avgResponseTime')
        .where('analytics.timestamp >= :startDate', { startDate })
        .groupBy('analytics.endpoint, analytics.method')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne(),
      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('AVG(analytics.responseTime)', 'avg')
        .where('analytics.timestamp >= :startDate', { startDate })
        .getRawOne(),
    ]);

    const requestsPerMinute = Math.round(totalRequests / (this.getHoursFromPeriod(period) * 60));

    return {
      requestsPerMinute,
      totalRequests,
      uniqueVisitors: parseInt(uniqueVisitors.count) || 0,
      peakHour: peakTrafficResult
        ? this.formatHour(peakTrafficResult.hour)
        : 'N/A',
      topEndpoint: topEndpointResult
        ? `${topEndpointResult.method} ${topEndpointResult.endpoint}`
        : 'N/A',
      avgResponseTime: Math.round(parseFloat(responseTimeResult?.avg) || 0),
      period,
    };
  }

  async getRequestMetrics(period: string = '24h') {
    const startDate = this.getDateFromPeriod(period);

    const isShortPeriod = period === '1h' || period === '24h';

    const results = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select(
        isShortPeriod
          ? "DATE_TRUNC('minute', analytics.timestamp)"
          : "DATE_TRUNC('hour', analytics.timestamp)",
        'time',
      )
      .addSelect('COUNT(*)', 'count')
      .where('analytics.timestamp >= :startDate', { startDate })
      .groupBy(isShortPeriod ? '1' : "DATE_TRUNC('hour', analytics.timestamp)")
      .orderBy('time', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      time: isShortPeriod
        ? this.formatMinute(r.time)
        : this.formatHour(r.time),
      count: parseInt(r.count),
    }));
  }

  async getPeakTraffic(period: string = '7d') {
    const startDate = this.getDateFromPeriod(period);

    const results = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select("DATE_TRUNC('hour', analytics.timestamp)", 'hour')
      .addSelect('COUNT(*)', 'requestCount')
      .where('analytics.timestamp >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('hour', analytics.timestamp)")
      .addOrderBy('COUNT(*)', 'DESC')
      .limit(24)
      .getRawMany();

    return results.map((r) => ({
      hour: this.formatHour(r.hour),
      requestCount: parseInt(r.requestCount),
    }));
  }

  async getUniqueVisitors(period: string = '7d') {
    const startDate = this.getDateFromPeriod(period);

    const results = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select("DATE_TRUNC('day', analytics.timestamp)", 'date')
      .addSelect('COUNT(DISTINCT COALESCE("analytics"."userId"::text, "analytics"."ipAddress"))', 'count')
      .where('analytics.timestamp >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('day', analytics.timestamp)")
      .orderBy("DATE_TRUNC('day', analytics.timestamp)", 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: this.formatDate(r.date),
      count: parseInt(r.count),
    }));
  }

  async getTopEndpoints(limit: number = 10) {
    const results = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.endpoint', 'endpoint')
      .addSelect('analytics.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(analytics.responseTime)', 'avgResponseTime')
      .groupBy('analytics.endpoint, analytics.method')
      .addOrderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      endpoint: r.endpoint,
      method: r.method,
      count: parseInt(r.count),
      avgResponseTime: Math.round(parseFloat(r.avgResponseTime)),
    }));
  }

  async getResponseTimeMetrics(period: string = '24h') {
    const startDate = this.getDateFromPeriod(period);

    const result = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.responseTime)', 'avg')
      .addSelect('MIN(analytics.responseTime)', 'min')
      .addSelect('MAX(analytics.responseTime)', 'max')
      .where('analytics.timestamp >= :startDate', { startDate })
      .getRawOne();

    return {
      avg: Math.round(parseFloat(result?.avg) || 0),
      min: Math.round(parseFloat(result?.min) || 0),
      max: Math.round(parseFloat(result?.max) || 0),
    };
  }

  private getHoursFromPeriod(period: string): number {
    switch (period) {
      case '1h':
        return 1;
      case '24h':
        return 24;
      case '7d':
        return 24 * 7;
      case '30d':
        return 24 * 30;
      default:
        return 24;
    }
  }

  private formatHour(date: string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatMinute(date: string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
