// src/product/product.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandController } from 'src/brand/brand.controller';
import { BrandService } from 'src/brand/brand.service';
import { Brand } from 'src/brand/entities/brand.entity';
import { CategoryController } from 'src/category/category.controller';
import { CategoryService } from 'src/category/category.service';
import { Category } from 'src/category/entities/category.entity';

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
    CacheModule.register(),
  ],
  controllers: [ProductController, CategoryController, BrandController],
  providers: [
    ProductService,
    CategoryService,
    BrandService,
    AttachmentService,
    UnitsService,
    SuppliersService,
  ],
  exports: [
    ProductService,
    CategoryService,
    BrandService,
    AttachmentService,
    UnitsService,
    SuppliersService,
  ],
})
export class ProductModule { }
