// src/order-payment-method/entities/order-payment-method.entity.ts
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
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
export class OrderPaymentMethod {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ example: 'Cash on Delivery', description: 'Display name' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({
    example: 'cash_on_delivery',
    description: 'System identifier',
  })
  code: string;

  @Column({ default: true })
  @ApiProperty({ example: true, description: 'Activation status' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    example: 'Pay when product is delivered',
    description: 'Method description',
  })
  description: string;

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

  @ApiHideProperty()
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @ApiHideProperty()
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: User;
}
