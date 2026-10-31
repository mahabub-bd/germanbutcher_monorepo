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

  /** Area-specific delivery charge (৳); null = inherit from the city. */
  @ApiProperty({ example: 250, nullable: true })
  @Column({ type: 'double precision', nullable: true })
  deliveryCharge: number | null;

  /** Area-specific minimum order amount (৳); null = inherit from the city. */
  @ApiProperty({ example: 1500, nullable: true })
  @Column({ type: 'double precision', nullable: true })
  minOrderAmount: number | null;

  /** Area-specific delivery time shown at checkout (e.g. "Within 24 hours");
   *  null = inherit from the city. */
  @ApiProperty({ example: 'Within 24 hours', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryTime: string | null;
}
