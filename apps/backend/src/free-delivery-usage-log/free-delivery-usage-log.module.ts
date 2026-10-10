import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreeDeliveryUsageLogController } from './free-delivery-usage-log.controller';
import { FreeDeliveryUsageLogService } from './free-delivery-usage-log.service';
import { FreeDeliveryUsageLog } from './entities/free-delivery-usage-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FreeDeliveryUsageLog])],
  providers: [FreeDeliveryUsageLogService],
  controllers: [FreeDeliveryUsageLogController],
  exports: [FreeDeliveryUsageLogService],
})
export class FreeDeliveryUsageLogModule {}
