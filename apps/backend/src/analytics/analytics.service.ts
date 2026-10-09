import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { LogRequestDto } from './dto/log-request.dto';
import { Analytics } from './entities/analytics.entity';

/** Flush the buffer once it holds this many rows (bulk INSERT). */
const DEFAULT_FLUSH_BATCH_SIZE = 100;
/** Flush cadence (ms) so low-traffic rows still land promptly. */
const DEFAULT_FLUSH_INTERVAL_MS = 3000;
/** Buffer cap — drop oldest rows if the DB is unreachable so memory stays bounded. */
const DEFAULT_MAX_BUFFER_SIZE = 1000;
/** Rows older than this many days are purged by the daily cron (0 disables). */
const DEFAULT_RETENTION_DAYS = 90;

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);

  private buffer: Partial<Analytics>[] = [];
  private isFlushing = false;
  private flushTimer: NodeJS.Timeout | null = null;

  private flushBatchSize: number;
  private maxBufferSize: number;

  constructor(
    @InjectRepository(Analytics)
    private analyticsRepository: Repository<Analytics>,
    private configService: ConfigService,
  ) {}

  onModuleInit(): void {
    this.flushBatchSize = this.configService.get<number>(
      'ANALYTICS_FLUSH_BATCH_SIZE',
      DEFAULT_FLUSH_BATCH_SIZE,
    );
    this.maxBufferSize = this.configService.get<number>(
      'ANALYTICS_MAX_BUFFER_SIZE',
      DEFAULT_MAX_BUFFER_SIZE,
    );
    const intervalMs = this.configService.get<number>(
      'ANALYTICS_FLUSH_INTERVAL_MS',
      DEFAULT_FLUSH_INTERVAL_MS,
    );

    this.flushTimer = setInterval(() => {
      void this.flush();
    }, intervalMs);
    // Don't hold the process open just for the timer
    this.flushTimer.unref?.();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }

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
    this.buffer.push(analytics);
    this.capBuffer();

    if (this.buffer.length >= this.flushBatchSize) {
      void this.flush();
    }
  }

  /** Shed the oldest rows when the buffer exceeds its cap (DB-down safety). */
  private capBuffer(): void {
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.splice(0, this.buffer.length - this.maxBufferSize);
    }
  }

  /** Bulk-insert buffered rows in one round trip. Single-flight so overlapping
   * timers/batches don't race; on failure rows are re-queued for the next try. */
  private async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) return;
    this.isFlushing = true;
    const batch = this.buffer;
    this.buffer = [];

    try {
      await this.analyticsRepository.insert(batch);
    } catch (error) {
      // Re-queue (respecting the cap) — the next interval tick retries
      this.buffer = [...batch, ...this.buffer];
      this.capBuffer();
      this.logger.error(
        `Failed to flush analytics batch: ${
          error instanceof Error ? error.message : error
        }`,
      );
    } finally {
      this.isFlushing = false;
    }
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

  /**
   * Scheduled task: purge analytics rows older than the retention window
   * (ANALYTICS_RETENTION_DAYS, default 90 — 0 disables). Keeps the table
   * from growing unbounded in production. Runs daily at 3 AM, after the
   * user-activity cleanup at 2 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledRetention(): Promise<void> {
    const days = this.configService.get<number>(
      'ANALYTICS_RETENTION_DAYS',
      DEFAULT_RETENTION_DAYS,
    );
    if (days <= 0) return;

    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const deleted = await this.analyticsRepository.delete({
        timestamp: LessThan(cutoff),
      });

      if (deleted.affected && deleted.affected > 0) {
        this.logger.log(
          `Analytics retention: deleted ${deleted.affected} rows older than ${days} days`,
        );
      }
    } catch (error) {
      this.logger.error('Error during analytics retention cleanup:', error);
    }
  }
}
