// src/cart/entities/cart-item.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/product/entities/product.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cart } from './cart.entity';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the cart item',
    type: Number,
  })
  id: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @ApiProperty({
    type: () => Cart,
    description: 'Parent cart containing this item',
  })
  cart: Cart;

  @ManyToOne(() => Product, { eager: true })
  @ApiProperty({
    type: () => Product,
    description: 'Product reference for this cart item',
  })
  product: Product;

  @Column({ type: 'int', default: 1 })
  @ApiProperty({
    example: 2,
    description: 'Quantity of the product in cart',
    minimum: 1,
    default: 1,
    type: Number,
  })
  quantity: number;

  @ApiProperty({
    example: 99.98,
    description: 'Total price for this cart item (quantity × price)',
    type: Number,
    readOnly: true,
  })
  get total(): number {
    return this.product.salePrice * this.quantity;
  }
}
