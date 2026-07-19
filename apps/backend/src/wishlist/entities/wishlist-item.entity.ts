
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/product/entities/product.entity';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Wishlist } from './wishlist.entity';

@Entity()
export class WishlistItem {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the wishlist item',
    type: Number,
  })
  id: number;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, {
    onDelete: 'CASCADE',
  })
  @ApiProperty({
    type: () => Wishlist,
    description: 'Parent wishlist containing this item',
  })
  wishlist: Wishlist;

  @ManyToOne(() => Product, { eager: true })
  @ApiProperty({
    type: () => Product,
    description: 'Product reference for this wishlist item',
  })
  product: Product;

  @ApiProperty({
    example: 99.98,
    description: 'Price of the product in wishlist',
    type: Number,
    readOnly: true,
  })
  get price(): number {
    return this.product.salePrice;
  }
}
