// src/shipping-methods/shipping-method.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ShippingMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('decimal', { precision: 10 })
  cost: number;

  @Column()
  deliveryTime: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  @ApiProperty({ example: true, description: 'Activation status' })
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty({
    example: false,
    description:
      'When true, orders with this shipping method must pay online (cash on delivery is rejected)',
  })
  requiresOnlinePayment: boolean;

  @Column({ default: false })
  @ApiProperty({
    example: false,
    description:
      'When true, free-delivery campaigns never waive this method\'s cost',
  })
  isExcludedFromFreeDelivery: boolean;

  @Column({ default: 0 })
  @ApiProperty({
    example: 1,
    description: 'Display order (lower numbers show first)',
  })
  displayOrder: number;

  @CreateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp',
    readOnly: true,
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update timestamp',
    readOnly: true,
  })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who recorded this payment',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this payment',
  })
  updatedBy: User;
}
