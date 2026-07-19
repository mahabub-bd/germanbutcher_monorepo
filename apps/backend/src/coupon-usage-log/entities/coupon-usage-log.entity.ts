import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { Order } from 'src/order/entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class CouponUsageLog {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ type: () => Coupon })
  @ManyToOne(() => Coupon)
  @JoinColumn()
  coupon: Coupon;

  @Column()
  couponCode: string;

  @ApiPropertyOptional({ type: () => Order })
  @ManyToOne(() => Order)
  @JoinColumn()
  order: Order;

  @ApiPropertyOptional({ type: () => User })
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ApiProperty({
    example: 25.5,
    description: 'Discount amount applied by this coupon',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({
    example: 100.0,
    description: 'Order total value before discount',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  orderTotal: number;

  @ApiProperty({
    example: 'PERCENTAGE',
    description: 'Type of discount (fixed or percentage)',
  })
  @Column({ type: 'varchar', nullable: true })
  discountType: string;

  @ApiProperty({
    example: 25,
    description: 'Discount value used',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountValue: number;

  @CreateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'When the coupon was used',
    readOnly: true,
  })
  createdAt: Date;
}
