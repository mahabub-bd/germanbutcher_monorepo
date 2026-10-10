import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FreeDeliveryUsageLog } from './entities/free-delivery-usage-log.entity';
import { Repository } from 'typeorm';

export interface CreateFreeDeliveryUsageLogInput {
  campaign: FreeDeliveryUsageLog['campaign'];
  campaignName: string;
  order: FreeDeliveryUsageLog['order'];
  user: FreeDeliveryUsageLog['user'];
  shippingWaived: number;
  orderTotal: number;
}

export interface FindAllUsageLogsOptions {
  page?: number;
  limit?: number;
  campaignId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface FreeDeliveryReportStatsOptions {
  campaignId?: number;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class FreeDeliveryUsageLogService {
  private readonly logger = new Logger(FreeDeliveryUsageLogService.name);

  constructor(
    @InjectRepository(FreeDeliveryUsageLog)
    private readonly usageLogRepository: Repository<FreeDeliveryUsageLog>,
  ) {}

  async create(
    input: CreateFreeDeliveryUsageLogInput,
  ): Promise<FreeDeliveryUsageLog> {
    const log = this.usageLogRepository.create(input);
    const saved = await this.usageLogRepository.save(log);

    this.logger.log(
      `Free delivery usage logged: campaign "${input.campaignName}" for order ${input.order.orderNo} by user ${input.user.email}`,
    );

    return saved;
  }

  async findAll(
    options: FindAllUsageLogsOptions = {},
  ): Promise<{ data: FreeDeliveryUsageLog[]; total: number }> {
    const { page = 1, limit = 10, campaignId, fromDate, toDate } = options;
    const skip = (page - 1) * limit;

    // All relations are ManyToOne, so skip/take paginate rows directly
    const dataQuery = this.usageLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.campaign', 'campaign')
      .leftJoinAndSelect('log.order', 'order')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Join-free count — the only filter is on a log column
    const countQuery = this.usageLogRepository.createQueryBuilder('log');

    if (campaignId) {
      dataQuery.where('log.campaign.id = :campaignId', { campaignId });
      countQuery.where('log.campaign.id = :campaignId', { campaignId });
    }

    // Date range is inclusive on both ends
    if (fromDate) {
      dataQuery.andWhere('log.createdAt >= :fromDate', {
        fromDate: `${fromDate} 00:00:00`,
      });
      countQuery.andWhere('log.createdAt >= :fromDate', {
        fromDate: `${fromDate} 00:00:00`,
      });
    }
    if (toDate) {
      dataQuery.andWhere('log.createdAt <= :toDate', {
        toDate: `${toDate} 23:59:59`,
      });
      countQuery.andWhere('log.createdAt <= :toDate', {
        toDate: `${toDate} 23:59:59`,
      });
    }

    const [data, total] = await Promise.all([
      dataQuery.getMany(),
      countQuery.getCount(),
    ]);

    return { data, total };
  }

  // Aggregate stats for the Reports page — across all campaigns (or one when
  // campaignId is given), optionally within a date range.
  async getReportStats(options: FreeDeliveryReportStatsOptions = {}) {
    const { campaignId, fromDate, toDate } = options;

    const query = this.usageLogRepository
      .createQueryBuilder('log')
      .select('COUNT(log.id)', 'totalUses')
      .addSelect('SUM(log.shippingWaived)', 'totalShippingWaived')
      .addSelect('SUM(log.orderTotal)', 'totalOrderValue')
      .addSelect('AVG(log.orderTotal)', 'avgOrderValue')
      .addSelect('COUNT(DISTINCT log.campaignName)', 'uniqueCampaigns');

    if (campaignId) {
      query.where('log.campaign.id = :campaignId', { campaignId });
    }
    if (fromDate) {
      query.andWhere('log.createdAt >= :fromDate', {
        fromDate: `${fromDate} 00:00:00`,
      });
    }
    if (toDate) {
      query.andWhere('log.createdAt <= :toDate', {
        toDate: `${toDate} 23:59:59`,
      });
    }

    const result = await query.getRawOne();

    return {
      totalUses: parseInt(result.totalUses) || 0,
      totalShippingWaived: parseFloat(result.totalShippingWaived) || 0,
      totalOrderValue: parseFloat(result.totalOrderValue) || 0,
      avgOrderValue: parseFloat(result.avgOrderValue) || 0,
      uniqueCampaigns: parseInt(result.uniqueCampaigns) || 0,
    };
  }
}
