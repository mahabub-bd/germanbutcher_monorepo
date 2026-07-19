import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SslPaymentController } from './ssl-payment.controller';

import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { OrderPayment } from 'src/order-payment/entities/order-payment.entity';
import { OrderPaymentService } from 'src/order-payment/order-payment.service';
import { Order } from 'src/order/entities/order.entity';
import { SSLPayment } from './entities/payment.entity';
import { SslPaymentService } from './ssl-payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SSLPayment,
      Order,
      OrderPayment,
      OrderPaymentMethod,
    ]),
    ConfigModule,
  ],
  controllers: [SslPaymentController],
  providers: [SslPaymentService, OrderPaymentService],
  exports: [SslPaymentService, OrderPaymentService],
})
export class SslPaymentModule {}
