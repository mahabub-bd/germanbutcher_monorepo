import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Unit } from './entities/unit.entity';
import { UnitsController } from './unit.controller';
import { UnitsService } from './unit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Unit, User])],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitModule {}
