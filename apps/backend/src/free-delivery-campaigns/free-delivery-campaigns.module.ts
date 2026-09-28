import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from 'src/order/entities/order.entity';
import { Product } from 'src/product/entities/product.entity';
import { FreeDeliveryCampaign } from './entities/free-delivery-campaign.entity';
import { FreeDeliveryCampaignsController } from './free-delivery-campaigns.controller';
import { FreeDeliveryCampaignsService } from './free-delivery-campaigns.service';

@Module({
  imports: [TypeOrmModule.forFeature([FreeDeliveryCampaign, Product, Order])],
  controllers: [FreeDeliveryCampaignsController],
  providers: [FreeDeliveryCampaignsService],
  exports: [FreeDeliveryCampaignsService],
})
export class FreeDeliveryCampaignsModule {}
