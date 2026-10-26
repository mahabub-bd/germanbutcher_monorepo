import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductHistory } from './entities/product-history.entity';
import { ProductHistoryService } from './product-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductHistory])],
  providers: [ProductHistoryService],
  exports: [ProductHistoryService],
})
export class ProductHistoryModule {}
