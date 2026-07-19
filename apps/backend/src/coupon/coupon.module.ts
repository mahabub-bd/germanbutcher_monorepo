import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';

import { Coupon } from './entities/coupon.entity';
import { Product } from 'src/product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, Product])],
  providers: [CouponService],
  controllers: [CouponController],
  exports: [CouponService],
})
export class CouponModule {}
