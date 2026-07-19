import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Wishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wishlist) private wishlistRepo: Repository<Wishlist>,
    @InjectRepository(WishlistItem) private itemRepo: Repository<WishlistItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async getUserWishlist(userId: number): Promise<Wishlist> {
    let wishlist = await this.wishlistRepo.findOne({
      where: { user: { id: userId } },
      relations: [
        'user',
        'items',
        'items.product',
        'items.product.attachment',
        'items.product.unit',
        'items.product.supplier',
      ],
    });

    // If wishlist doesn't exist, create one automatically
    if (!wishlist) {
      // Get the full user entity
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      wishlist = this.wishlistRepo.create({
        user: user,
        items: [],
      });

      wishlist = await this.wishlistRepo.save(wishlist);

      wishlist = await this.wishlistRepo.findOne({
        where: { id: wishlist.id },
        relations: [
          'user',
          'items',
          'items.product',
          'items.product.attachment',
          'items.product.unit',
          'items.product.supplier',
        ],
      });
    }

    return wishlist;
  }

  async addItemToWishlist(
    dto: AddWishlistItemDto,
    user: User,
  ): Promise<Wishlist> {
    const wishlist = await this.getUserWishlist(user?.userId);

    const product = await this.productRepo.findOneBy({ id: dto.productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = wishlist.items?.find(
      (item) => item.product.id === dto.productId,
    );

    if (existingItem) {
      // Product already exists in wishlist, no need to add again
    } else {
      // Create new wishlist item
      const newItem = this.itemRepo.create({
        wishlist,
        product,
      });

      await this.itemRepo.save(newItem);
    }

    // Return updated wishlist
    return this.getUserWishlist(user?.userId);
  }

  async removeItemFromWishlist(
    userId: number,
    itemId: number,
  ): Promise<Wishlist> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, wishlist: { user: { id: userId } } },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.itemRepo.remove(item);
    return this.getUserWishlist(userId);
  }

  async clearWishlist(userId: number): Promise<Wishlist> {
    const wishlist = await this.getUserWishlist(userId);

    if (wishlist.items.length > 0) {
      await this.itemRepo.remove(wishlist.items);
    }

    return this.getUserWishlist(userId);
  }
}
