// order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/address/entities/address.entity';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { DeliveryMan } from 'src/delivery-man/entities/delivery-man.entity';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { OrderPayment } from 'src/order-payment/entities/order-payment.entity';
import { OrderPaymentService } from 'src/order-payment/order-payment.service';
import { Product } from 'src/product/entities/product.entity';
import { ShippingMethod } from 'src/shipping-methods/entities/shipping-method.entity';
import { User } from 'src/user/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusTrack } from './entities/order-status-track.entity';
import { Order } from './entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { EmailModule } from 'src/email/email.module';
import { NotificationModule } from 'src/notification/notification.module';
import { SmsModule } from 'src/auth/sms.module';
import { DeliveryManModule } from 'src/delivery-man/delivery-man.module';
import { CouponUsageLogModule } from 'src/coupon-usage-log/coupon-usage-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      User,
      Address,
      ShippingMethod,
      OrderPaymentMethod,
      Coupon,
      Product,
      OrderPayment,
      OrderStatusTrack,
      DeliveryMan,
    ]),
    EmailModule,
    NotificationModule,
    SmsModule,
    DeliveryManModule,
    CouponUsageLogModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderPaymentService],
  exports: [OrderService, OrderPaymentService],
})
export class OrderModule {}
