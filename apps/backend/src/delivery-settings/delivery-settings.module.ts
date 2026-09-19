import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeliverySetting } from './entities/delivery-setting.entity';
import { DeliverySettingsController } from './delivery-settings.controller';
import { DeliverySettingsService } from './delivery-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeliverySetting])],
  controllers: [DeliverySettingsController],
  providers: [DeliverySettingsService],
  exports: [DeliverySettingsService],
})
export class DeliverySettingsModule {}
