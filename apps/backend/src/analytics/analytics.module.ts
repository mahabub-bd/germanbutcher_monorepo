import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analytics } from './entities/analytics.entity';
import { Order } from 'src/order/entities/order.entity';
import { Product } from 'src/product/entities/product.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsTrackController } from './analytics-track.controller';
import { AnalyticsInterceptor } from './interceptors/analytics.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Analytics, Order, Product])],
  controllers: [AnalyticsController, AnalyticsTrackController],
  providers: [AnalyticsService, AnalyticsInterceptor],
  exports: [AnalyticsService, AnalyticsInterceptor],
})
export class AnalyticsModule {}
