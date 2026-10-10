import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { EmailModule } from 'src/email/email.module';
import { OrderItem } from 'src/order/entities/order-item.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';
import { ProductReview } from './entities/product-review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductReview,
      OrderItem,
      Attachment,
      Product,
      User,
    ]),
    EmailModule,
  ],
  controllers: [ProductReviewController],
  providers: [ProductReviewService],
  exports: [ProductReviewService],
})
export class ProductReviewModule {}
