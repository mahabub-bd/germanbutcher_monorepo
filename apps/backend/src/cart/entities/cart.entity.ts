// src/cart/entities/cart.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the cart',
    type: Number,
  })
  id: number;

  @OneToOne(() => User, (user) => user.cart, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart)
  @ApiProperty({
    type: () => [CartItem],
    description: 'Items in the shopping cart',
  })
  items: CartItem[];

  @CreateDateColumn()
  @ApiProperty({
    example: '2024-03-05T08:54:04.000Z',
    description: 'Cart creation timestamp',
    type: Date,
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2024-03-05T09:30:00.000Z',
    description: 'Cart last update timestamp',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    example: 149.99,
    description: 'Total value of all items in cart',
    type: Number,
    readOnly: true,
  })
  get total(): number {
    return this.items.reduce(
      (sum, item) => sum + item.product.salePrice * item.quantity,
      0,
    );
  }

  @ApiProperty({
    example: 3,
    description: 'Total number of items in cart (sum of quantities)',
    type: Number,
    readOnly: true,
  })
  @Expose() // Add this decorator
  get totalItems(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }
}
