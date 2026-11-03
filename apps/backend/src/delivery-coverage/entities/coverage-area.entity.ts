import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CoverageCity } from './coverage-city.entity';

/** A deliverable area under a city. Its own pricing, when set, overrides
 *  the city's. */
@Entity('delivery_coverage_areas')
@Index(['cityId'])
export class CoverageArea {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => CoverageCity })
  @ManyToOne(() => CoverageCity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city: CoverageCity;

  @Column({ type: 'int' })
  cityId: number;

  @ApiProperty({ example: 'Badda' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  enabled: boolean;
}
