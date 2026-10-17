import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BogoUsageLogController } from './bogo-usage-log.controller';
import { BogoUsageLogService } from './bogo-usage-log.service';
import { BogoUsageLog } from './entities/bogo-usage-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BogoUsageLog])],
  providers: [BogoUsageLogService],
  controllers: [BogoUsageLogController],
  exports: [BogoUsageLogService],
})
export class BogoUsageLogModule {}
