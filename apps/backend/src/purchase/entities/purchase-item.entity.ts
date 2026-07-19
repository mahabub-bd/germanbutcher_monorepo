// src/purchase/entities/purchase-item.entity.ts
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Purchase } from './purchase.entity';

@ApiTags('Purchase')
@Entity()
export class PurchaseItem {
  @ApiProperty({
    description: 'The unique identifier of the purchase item',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    type: () => Purchase,
    description: 'The associated purchase order',
  })
  @ManyToOne(() => Purchase, (purchase) => purchase.items)
  purchase: Purchase;

  @ApiProperty({
    type: () => Product,
    description: 'The product associated with this purchase item',
  })
  @ManyToOne(() => Product)
  product: Product;

  @ApiProperty({
    description: 'Unit price of the product at the time of purchase',
    example: 29.99,
    type: Number,
  })
  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({
    description: 'Quantity of the product purchased',
    example: 2,
    type: Number,
  })
  @Column('int')
  quantity: number;

  @ApiProperty({
    description: 'Total price for this item (unitPrice * quantity)',
    example: 59.98,
    type: Number,
  })
  @Column('decimal', { precision: 10, scale: 2 })
  total: number;
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
  @ApiProperty({
    type: () => User,
    description: 'User who created this purchase item',
  })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @ApiProperty({
    type: () => User,
    description: 'User who last updated this purchase item',
  })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: User;
}
