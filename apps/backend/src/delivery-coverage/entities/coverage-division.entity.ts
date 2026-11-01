import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Top level of the delivery coverage tree (e.g. "Dhaka"). */
@Entity('delivery_coverage_divisions')
export class CoverageDivision {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Dhaka' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  /** Division-wide delivery time shown at checkout (e.g. "48-72 hours"),
   *  inherited by its cities and areas; null = show the shipping method's
   *  own time. */
  @ApiProperty({ example: '48-72 hours', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryTime: string | null;
}
