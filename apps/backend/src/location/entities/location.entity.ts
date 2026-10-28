import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from 'src/common/enums';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Canonical list of divisions, cities (districts) and areas used by the
 * address form. Self-referencing: cities point to their division and areas
 * to their city via parentId. The list was seeded from
 * scripts/bd-districts-areas.ts (see scripts/seed-locations.js).
 */
@Entity()
@Index(['type', 'name'], { unique: true, where: 'type = \'division\'' })
@Index(['parentId', 'name'], { unique: true })
export class Location {
  @PrimaryGeneratedColumn()
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ example: 'Uttara' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ enum: LocationType, example: LocationType.AREA })
  @Column({ type: 'enum', enum: LocationType })
  type: LocationType;

  /** Division (for cities) or city (for areas); NULL for divisions. */
  @ManyToOne(() => Location, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Location | null;

  @Column({ name: 'parentId', type: 'int', nullable: true })
  parentId: number | null;
}
