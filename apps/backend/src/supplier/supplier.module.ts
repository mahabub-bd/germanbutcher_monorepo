import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Supplier } from './entities/supplier.entity';
import { SuppliersController } from './supplier.controller';
import { SuppliersService } from './supplier.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, User])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
