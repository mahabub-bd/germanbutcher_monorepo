import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { AddCartItemDto } from './dto/cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private itemRepo: Repository<CartItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async getUserCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
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

    // If cart doesn't exist, create one automatically
    if (!cart) {
      // Get the full user entity
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newCart = this.cartRepo.create({
        user: user,
        items: [],
      });

      try {
        await this.cartRepo.save(newCart);
      } catch (error: any) {
        // Handle race condition: if another request created the cart first,
        // just fetch the existing one
        if (error.code === '23505') {
          // Duplicate key error - cart was created by another request
          cart = await this.cartRepo.findOne({
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

          if (cart) {
            return cart;
          }
        }
        throw error;
      }

      cart = await this.cartRepo.findOne({
        where: { id: newCart.id },
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

    return cart;
  }

  async addItemToCart(dto: AddCartItemDto, user: User): Promise<Cart> {
    const cart = await this.getUserCart(user?.userId);

    const product = await this.productRepo.findOneBy({ id: dto.productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = cart.items?.find(
      (item) => item.product.id === dto.productId,
    );

    if (existingItem) {
      // Update existing item quantity
      existingItem.quantity += dto.quantity;
      await this.itemRepo.save(existingItem);
    } else {
      // Create new cart item
      const newItem = this.itemRepo.create({
        cart,
        product,
        quantity: dto.quantity,
      });

      await this.itemRepo.save(newItem);
    }

    // Return updated cart
    return this.getUserCart(user?.userId);
  }

  async updateItemQuantity(
    user: User,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, cart: { user: { id: user?.userId } } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = dto.quantity;
    await this.itemRepo.save(item);

    // Return updated cart
    return this.getUserCart(user?.userId);
  }

  async removeItemFromCart(user: User, itemId: number): Promise<Cart> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, cart: { user: { id: user?.userId } } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.itemRepo.remove(item);
    return this.getUserCart(user?.userId);
  }

  async clearCart(user: User): Promise<Cart> {
    const cart = await this.getUserCart(user?.userId);

    if (cart.items.length > 0) {
      await this.itemRepo.remove(cart.items);
    }

    return this.getUserCart(user?.userId);
  }
}