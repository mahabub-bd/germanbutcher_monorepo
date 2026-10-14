import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FlashSaleCampaign } from './entities/flash-sale-campaign.entity';
import { FlashSaleCampaignsController } from './flash-sale-campaigns.controller';
import { FlashSaleCampaignsService } from './flash-sale-campaigns.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlashSaleCampaign])],
  controllers: [FlashSaleCampaignsController],
  providers: [FlashSaleCampaignsService],
  exports: [FlashSaleCampaignsService],
})
export class FlashSaleCampaignsModule {}
