import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentMethodController } from './payment-method.controller';
import { PaymentMethodService } from './payment-method.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod, User])],
  controllers: [PaymentMethodController],
  providers: [PaymentMethodService],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule {}
