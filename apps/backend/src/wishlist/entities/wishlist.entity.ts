// src/wishlist/entities/wishlist.entity.ts
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
import { WishlistItem } from './wishlist-item.entity';

@Entity()
export class Wishlist {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the wishlist',
    type: Number,
  })
  id: number;

  @OneToOne(() => User, (user) => user.wishlist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => WishlistItem, (item) => item.wishlist)
  @ApiProperty({
    type: () => [WishlistItem],
    description: 'Items in the wishlist',
  })
  items: WishlistItem[];

  @CreateDateColumn()
  @ApiProperty({
    example: '2024-03-05T08:54:04.000Z',
    description: 'Wishlist creation timestamp',
    type: Date,
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2024-03-05T09:30:00.000Z',
    description: 'Wishlist last update timestamp',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    example: 3,
    description: 'Total number of items in wishlist',
    type: Number,
    readOnly: true,
  })
  @Expose()
  get totalItems(): number {
    return this.items?.length || 0;
  }
}
