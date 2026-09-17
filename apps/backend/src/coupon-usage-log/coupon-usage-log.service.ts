import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponUsageLogDto } from './dto/create-coupon-usage-log.dto';
import { CouponUsageLog } from './entities/coupon-usage-log.entity';

export interface FindAllUsageLogsOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class CouponUsageLogService {
  private readonly logger = new Logger(CouponUsageLogService.name);

  constructor(
    @InjectRepository(CouponUsageLog)
    private readonly couponUsageLogRepository: Repository<CouponUsageLog>,
  ) {}

  async create(
    createCouponUsageLogDto: CreateCouponUsageLogDto,
  ): Promise<CouponUsageLog> {
    const log = this.couponUsageLogRepository.create(createCouponUsageLogDto);
    const saved = await this.couponUsageLogRepository.save(log);

    this.logger.log(
      `Coupon usage logged: ${createCouponUsageLogDto.couponCode} for order ${createCouponUsageLogDto.order.orderNo} by user ${createCouponUsageLogDto.user.email}`,
    );

    return saved;
  }

  async findByCouponCode(
    couponCode: string,
    options: FindAllUsageLogsOptions = {},
  ): Promise<any> {
    return this.findPaginated({ couponCode }, options);
  }

  async findAll(options: FindAllUsageLogsOptions = {}): Promise<any> {
    return this.findPaginated({}, options);
  }

  private async findPaginated(
    filter: { couponCode?: string },
    { page = 1, limit = 10 }: FindAllUsageLogsOptions,
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit;

    // All relations are ManyToOne, so skip/take paginate rows directly
    const dataQuery = this.couponUsageLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.coupon', 'coupon')
      .leftJoinAndSelect('log.order', 'order')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Join-free count — the only filter is on a log column
    const countQuery = this.couponUsageLogRepository.createQueryBuilder('log');

    if (filter.couponCode) {
      dataQuery.where('log.couponCode = :couponCode', {
        couponCode: filter.couponCode,
      });
      countQuery.where('log.couponCode = :couponCode', {
        couponCode: filter.couponCode,
      });
    }

    const [logs, total] = await Promise.all([
      dataQuery.getMany(),
      countQuery.getCount(),
    ]);

    return { data: logs.map((log) => this.formatLogResponse(log)), total };
  }

  async findOne(id: number): Promise<any> {
    const log = await this.couponUsageLogRepository.findOne({
      where: { id },
      relations: ['coupon', 'order', 'user'],
    });

    if (!log) {
      throw new NotFoundException(`Coupon usage log with ID ${id} not found`);
    }

    return this.formatLogResponse(log);
  }

  private formatLogResponse(log: CouponUsageLog): any {
    return {
      id: log.id,
      couponCode: log.couponCode,
      discountAmount: Number(log.discountAmount),
      orderTotal: Number(log.orderTotal),
      discountType: log.discountType,
      discountValue: log.discountValue ? Number(log.discountValue) : null,
      createdAt: log.createdAt,
      coupon: log.coupon
        ? {
            id: log.coupon.id,
            code: log.coupon.code,
            discountType: log.coupon.discountType,
            value: Number(log.coupon.value),
            isActive: log.coupon.isActive,
          }
        : null,
      order: log.order
        ? {
            id: log.order.id,
            orderNo: log.order.orderNo,
            orderStatus: log.order.orderStatus,
            paymentStatus: log.order.paymentStatus,
            totalValue: Number(log.order.totalValue),
            totalDiscount: Number(log.order.totalDiscount),
            createdAt: log.order.createdAt,
          }
        : null,
      user: log.user
        ? {
            id: log.user.id,
            name: log.user.name,
            email: log.user.email,
            mobileNumber: log.user.mobileNumber,
          }
        : null,
    };
  }

  async getCouponUsageStats(couponCode: string) {
    const result = await this.couponUsageLogRepository
      .createQueryBuilder('log')
      .select('COUNT(log.id)', 'totalUses')
      .addSelect('SUM(log.discountAmount)', 'totalDiscountGiven')
      .addSelect('AVG(log.discountAmount)', 'avgDiscountAmount')
      .addSelect('SUM(log.orderTotal)', 'totalOrderValue')
      .where('log.couponCode = :couponCode', { couponCode })
      .getRawOne();

    return {
      couponCode,
      totalUses: parseInt(result.totalUses) || 0,
      totalDiscountGiven: parseFloat(result.totalDiscountGiven) || 0,
      avgDiscountAmount: parseFloat(result.avgDiscountAmount) || 0,
      totalOrderValue: parseFloat(result.totalOrderValue) || 0,
    };
  }
}
