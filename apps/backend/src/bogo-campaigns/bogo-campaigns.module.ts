import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FlashSaleCampaignsModule } from 'src/flash-sale-campaigns/flash-sale-campaigns.module';
import { Product } from 'src/product/entities/product.entity';
import { BogoCampaign } from './entities/bogo-campaign.entity';
import { BogoCampaignsController } from './bogo-campaigns.controller';
import { BogoCampaignsService } from './bogo-campaigns.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BogoCampaign, Product]),
    FlashSaleCampaignsModule,
  ],
  controllers: [BogoCampaignsController],
  providers: [BogoCampaignsService],
  exports: [BogoCampaignsService],
})
export class BogoCampaignsModule {}
