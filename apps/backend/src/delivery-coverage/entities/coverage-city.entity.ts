import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CoverageDivision } from './coverage-division.entity';

/** A district under a division. Its pricing is inherited by its areas. */
@Entity('delivery_coverage_cities')
@Index(['divisionId'])
export class CoverageCity {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => CoverageDivision })
  @ManyToOne(() => CoverageDivision, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'divisionId' })
  division: CoverageDivision;

  @Column({ type: 'int' })
  divisionId: number;

  @ApiProperty({ example: 'Dhaka' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  /** City-wide delivery charge (৳) inherited by its areas; null = shipping method cost. */
  @ApiProperty({ example: 200, nullable: true })
  @Column({ type: 'double precision', nullable: true })
  deliveryCharge: number | null;

  /** City-wide minimum order amount (৳) inherited by its areas; null = no minimum. */
  @ApiProperty({ example: 2000, nullable: true })
  @Column({ type: 'double precision', nullable: true })
  minOrderAmount: number | null;

  /** City-wide delivery time shown at checkout (e.g. "24-48 hours"),
   *  inherited by its areas; null = show the shipping method's own time. */
  @ApiProperty({ example: '24-48 hours', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryTime: string | null;
}
