import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementService } from './stock-movement.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement])],
  providers: [StockMovementService],
  exports: [StockMovementService],
})
export class StockMovementModule {}
