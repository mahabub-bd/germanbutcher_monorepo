import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesPoint } from 'src/sales-point/entities/sales-point.entity';
import { SalesPointShop } from './entities/sales-point-shop.entity';
import { SalesPointShopController } from './sales-point-shop.controller';
import { SalesPointShopService } from './sales-point-shop.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesPoint, SalesPointShop])],
  controllers: [SalesPointShopController],
  providers: [SalesPointShopService],
  exports: [SalesPointShopService],
})
export class SalesPointShopModule {}
