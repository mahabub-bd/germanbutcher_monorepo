import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Attachment } from 'src/attachment/entities/attachment.entity';
import { BusinessSetting } from './entities/business-setting.entity';
import { BusinessSettingsController } from './business-settings.controller';
import { BusinessSettingsService } from './business-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessSetting, Attachment])],
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
