import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from 'src/payment-method/entities/payment-method.entity';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { User } from 'src/user/entities/user.entity';
import { Payment } from './entities/payment.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Purchase, User, PaymentMethod])],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentMethodService],
  exports: [PaymentService, PaymentMethodService],
})
export class PaymentModule {}
