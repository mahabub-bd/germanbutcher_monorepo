// src/product/product.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from 'src/brand/entities/brand.entity';
import { Category } from 'src/category/entities/category.entity';

import { FlashSaleCampaignsModule } from 'src/flash-sale-campaigns/flash-sale-campaigns.module';
import { BogoCampaignsModule } from 'src/bogo-campaigns/bogo-campaigns.module';

import { AttachmentService } from 'src/attachment/attachment.service';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { Gallery } from 'src/gallery/entities/gallery.entity';
import { Supplier } from 'src/supplier/entities/supplier.entity';
import { SuppliersService } from 'src/supplier/supplier.service';
import { Unit } from 'src/unit/entities/unit.entity';
import { UnitsService } from 'src/unit/unit.service';
import { User } from 'src/user/entities/user.entity';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductHistoryModule } from 'src/product-history/product-history.module';
import { StockMovementModule } from 'src/stock-movement/stock-movement.module';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Brand,
      Attachment,
      Unit,
      User,
      Supplier,
      Gallery,
      Coupon,
    ]),
    FlashSaleCampaignsModule,
    BogoCampaignsModule,
    ProductHistoryModule,
    StockMovementModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    AttachmentService,
    UnitsService,
    SuppliersService,
  ],
  exports: [
    ProductService,
    AttachmentService,
    UnitsService,
    SuppliersService,
  ],
})
export class ProductModule { }
