import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entities/product.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { User } from '../user/entities/user.entity';
import { Purchase } from './entities/purchase.entity';

import { Payment } from 'src/payment/entities/payment.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchasesController } from './purchase.controller';
import { PurchasesService } from './purchase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Purchase,
      Product,
      Supplier,
      User,
      Payment,
      PurchaseItem,
    ]),
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
