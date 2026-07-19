import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingMethod } from './entities/shipping-method.entity';
import { ShippingMethodsController } from './shipping-methods.controller';
import { ShippingMethodsService } from './shipping-methods.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingMethod])],
  controllers: [ShippingMethodsController],
  providers: [ShippingMethodsService],
})
export class ShippingMethodsModule {}
