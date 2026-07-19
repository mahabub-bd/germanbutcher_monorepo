import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';
import { AddressesController } from './address.controller';
import { AddressesService } from './address.service';
import { Address } from './entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address, User])],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressModule {}
