import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { SalesPointShop } from 'src/sales-point-shop/entities/sales-point-shop.entity';
import { SalesPoint } from './entities/sales-point.entity';
import { SalesPointController } from './sales-point.controller';
import { SalesPointService } from './sales-point.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesPoint, Attachment, SalesPointShop])],
  controllers: [SalesPointController],
  providers: [SalesPointService],
  exports: [SalesPointService],
})
export class SalesPointModule {}
