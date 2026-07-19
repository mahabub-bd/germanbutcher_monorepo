import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponUsageLogDto } from './dto/create-coupon-usage-log.dto';
import { CouponUsageLog } from './entities/coupon-usage-log.entity';

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

  async findByCouponCode(couponCode: string): Promise<any[]> {
    const logs = await this.couponUsageLogRepository.find({
      where: { couponCode },
      relations: ['coupon', 'order', 'user'],
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.formatLogResponse(log));
  }

  async findAll(): Promise<any[]> {
    const logs = await this.couponUsageLogRepository.find({
      relations: ['coupon', 'order', 'user'],
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.formatLogResponse(log));
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
