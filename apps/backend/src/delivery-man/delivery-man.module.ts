import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryManService } from './delivery-man.service';
import { DeliveryManController } from './delivery-man.controller';
import { DeliveryMan } from './entities/delivery-man.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryMan])],
  controllers: [DeliveryManController],
  providers: [DeliveryManService],
  exports: [DeliveryManService],
})
export class DeliveryManModule {}
