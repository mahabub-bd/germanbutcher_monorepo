import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DeliverySetting {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: false,
    description: 'Whether free delivery above a threshold is active',
  })
  @Column({ default: false })
  freeDeliveryEnabled: boolean;

  @ApiProperty({
    example: 2000,
    description: 'Minimum payable order amount that qualifies for free delivery',
  })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  freeDeliveryThreshold: number;
}
