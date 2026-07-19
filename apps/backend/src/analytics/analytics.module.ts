import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analytics } from './entities/analytics.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsInterceptor } from './interceptors/analytics.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Analytics])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsInterceptor],
  exports: [AnalyticsService, AnalyticsInterceptor],
})
export class AnalyticsModule {}
