// src/units/entities/unit.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Unit {
  @ApiProperty({
    description: 'Unique identifier of the unit',
    example: '1',
  })
  @PrimaryGeneratedColumn()
  id: string;

  @ApiProperty({
    description: 'Name of the unit',
    example: 'Kilogram',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @ApiProperty({
    description: 'Whether the unit is active',
    example: true,
    default: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Date when the unit was created',
    example: '2023-05-14T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_date' })
  createdAt: Date;
  @UpdateDateColumn()
  @ApiProperty({
    description: 'Date when the unit was last updated',
    example: '2023-05-15T15:30:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'User who created the unit',
    type: () => User,
  })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdby' })
  createdBy: User;

  @ApiProperty({
    description: 'User who last updated the unit',
    type: () => User,
  })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedby' })
  updatedBy: User;

  @ApiProperty({
    description: 'Products using this unit',
    type: () => [Product],
  })
  @OneToMany(() => Product, (product) => product.unit)
  products: Product[];
}
