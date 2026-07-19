import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { Order } from 'src/order/entities/order.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { OrderPaymentController } from './order-payment.controller';
import { OrderPaymentService } from './order-payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderPayment, OrderPaymentMethod]),
  ],
  controllers: [OrderPaymentController],
  providers: [OrderPaymentService],
  exports: [OrderPaymentService],
})
export class OrderPaymentModule {}
