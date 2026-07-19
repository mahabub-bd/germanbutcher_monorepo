import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponUsageLogController } from './coupon-usage-log.controller';
import { CouponUsageLogService } from './coupon-usage-log.service';
import { CouponUsageLog } from './entities/coupon-usage-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CouponUsageLog])],
  providers: [CouponUsageLogService],
  controllers: [CouponUsageLogController],
  exports: [CouponUsageLogService],
})
export class CouponUsageLogModule {}
