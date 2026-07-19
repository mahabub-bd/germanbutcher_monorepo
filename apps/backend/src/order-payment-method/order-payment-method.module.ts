import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderPaymentMethod } from './entities/order-payment-method.entity';
import { OrderPaymentMethodController } from './order-payment-method.controller';
import { OrderPaymentMethodService } from './order-payment-method.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderPaymentMethod])],
  controllers: [OrderPaymentMethodController],
  providers: [OrderPaymentMethodService],
  exports: [OrderPaymentMethodService],
})
export class OrderPaymentMethodModule {}
