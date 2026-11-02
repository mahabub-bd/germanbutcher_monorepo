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
}
