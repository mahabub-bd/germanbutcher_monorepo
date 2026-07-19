import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Address } from 'src/address/entities/address.entity';
import { OrderStatus, PaymentStatus } from 'src/common/enums';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { DeliveryMan } from 'src/delivery-man/entities/delivery-man.entity';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { OrderPayment } from 'src/order-payment/entities/order-payment.entity';
import { ShippingMethod } from 'src/shipping-methods/entities/shipping-method.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderStatusTrack } from './order-status-track.entity';

@Entity()
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'ORD123456' })
  @Column({ unique: true })
  orderNo: string;

  @ApiProperty({ type: () => Address })
  @ManyToOne(() => Address)
  @JoinColumn()
  address: Address;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ApiProperty({ type: () => ShippingMethod })
  @ManyToOne(() => ShippingMethod)
  @JoinColumn()
  shippingMethod: ShippingMethod;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ApiPropertyOptional({ type: () => Coupon })
  @ManyToOne(() => Coupon, { nullable: true })
  @JoinColumn()
  coupon?: Coupon;

  @ApiProperty({
    example: 1200.5,
    description: 'Total order value before discounts',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalValue: number;

  @ApiProperty({
    example: 200.25,
    description: 'Total discount from products and coupons',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDiscount: number;

  @ApiProperty({
    example: 0,
    description: 'The amount already paid for the order',
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  @ApiProperty({
    type: () => OrderPaymentMethod,
    description: 'Payment method used for the order',
  })
  @ManyToOne(() => OrderPaymentMethod)
  @JoinColumn()
  paymentMethod: OrderPaymentMethod;

  @OneToMany(() => OrderPayment, (payment) => payment.order)
  payments: OrderPayment[];

  @OneToMany(() => OrderStatusTrack, (track) => track.order, { cascade: true })
  statusTracks: OrderStatusTrack[];

  @ApiPropertyOptional({ type: () => DeliveryMan })
  @ManyToOne(() => DeliveryMan, { nullable: true })
  @JoinColumn()
  deliveryMan?: DeliveryMan;

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
}
