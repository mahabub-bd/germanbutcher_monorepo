import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Payment } from 'src/payment/entities/payment.entity';
import { User } from 'src/user/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PaymentMethod extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier for the payment method',
  })
  id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: 'bank_transfer',
    description: 'Unique code for the payment method',
  })
  code: string;

  @Column()
  @ApiProperty({
    example: 'Bank Transfer',
    description: 'Display name of the payment method',
  })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example: 'Payment via bank transfer',
    description: 'Description of the payment method',
  })
  description: string;

  @Column({ default: true })
  @ApiProperty({
    example: true,
    description: 'Whether the payment method is active',
    default: true,
  })
  isActive: boolean;

  @OneToMany(() => Payment, (payment) => payment.paymentMethod)
  @ApiProperty({
    type: () => [Payment],
    description: 'Payments using this method',
    required: false,
  })
  payments: Payment[];

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
    description: 'User who created this payment method',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this payment method',
  })
  updatedBy: User;
}
