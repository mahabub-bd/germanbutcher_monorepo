import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSaleUsageLogController } from './flash-sale-usage-log.controller';
import { FlashSaleUsageLogService } from './flash-sale-usage-log.service';
import { FlashSaleUsageLog } from './entities/flash-sale-usage-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FlashSaleUsageLog])],
  providers: [FlashSaleUsageLogService],
  controllers: [FlashSaleUsageLogController],
  exports: [FlashSaleUsageLogService],
})
export class FlashSaleUsageLogModule {}
