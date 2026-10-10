import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { OrderItem } from 'src/order/entities/order-item.entity';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';
import { ProductReview } from './entities/product-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductReview, OrderItem, Attachment])],
  controllers: [ProductReviewController],
  providers: [ProductReviewService],
  exports: [ProductReviewService],
})
export class ProductReviewModule {}
