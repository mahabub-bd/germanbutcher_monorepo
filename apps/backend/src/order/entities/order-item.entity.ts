import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/product/entities/product.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderItem {
  @ApiProperty({ example: 1, description: 'Unique ID of the order item' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 101, description: 'ID of the associated product' })
  @Column()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity of the product ordered' })
  @Column()
  quantity: number;

  @ApiProperty({ type: () => Order, description: 'Associated order' })
  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiProperty({ example: 500, description: 'Price per unit when ordered' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @ApiProperty({
    example: 1000,
    description: 'Total price for the quantity at time of order',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @ApiProperty({ example: 50, description: 'Discount per unit when ordered' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitDiscount: number;

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
