import { ApiProperty } from '@nestjs/swagger';

import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { Order } from 'src/order/entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import { PaymentType } from 'src/common/enums';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// order-payment.entity.ts
@Entity()
export class OrderPayment extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ example: 'ORD-PAY-2023-0001' })
  paymentNumber: string;

  @ManyToOne(() => Order, { eager: true })
  @JoinColumn()
  @ApiProperty({ type: () => Order })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ example: 99.99 })
  amount: number;

  @Column({
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  @ApiProperty({ example: '2023-05-15' })
  paymentDate: Date;

  @ManyToOne(() => OrderPaymentMethod, { eager: true })
  @JoinColumn()
  @ApiProperty({ type: () => OrderPaymentMethod })
  paymentMethod: OrderPaymentMethod;

  @Column({ nullable: true })
  @ApiProperty({ example: 'ch_1JXbZ...' })
  sslPaymentId: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: '260217203402M8MgFEnM5KSsfZb',
    description: 'Bank transaction ID from SSLCommerz (used for refunds)',
  })
  bankTranId?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    example: 'Partial cash payment collected on delivery',
    description: 'Optional note or description for the payment',
    required: false,
  })
  notes?: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.PAYMENT,
  })
  @ApiProperty({
    enum: PaymentType,
    example: PaymentType.PAYMENT,
    description: 'Type of payment transaction',
  })
  paymentType: PaymentType;

  @ManyToOne(() => OrderPayment, { nullable: true, eager: false })
  @JoinColumn({ name: 'originalPaymentId' })
  @ApiProperty({
    type: () => OrderPayment,
    required: false,
    description: 'Original payment being refunded (for refund transactions)',
  })
  originalPayment?: OrderPayment;

  @Column({ nullable: true })
  @ApiProperty({
    required: false,
    description: 'ID of the original payment being refunded',
  })
  originalPaymentId?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
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
  @JoinColumn({ name: 'createdby' })
  @ApiProperty({
    type: () => User,
    description: 'User who created this product',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedby' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this product',
  })
  updatedBy: User;
}
