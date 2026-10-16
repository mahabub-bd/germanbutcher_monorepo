import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FlashSaleCampaignsService,
} from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
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
    private readonly flashSaleCampaignsService: FlashSaleCampaignsService,
  ) {}

  /** Attach flash-sale pricing info to every product in the cart so the
   * storefront cart/checkout show the same price the order service will
   * charge. Display-only props; the cart itself is never saved after this. */
  private async withFlashSale(cart: Cart): Promise<Cart> {
    const products = (cart.items ?? [])
      .map((item) => item.product)
      .filter(Boolean);
    if (products.length) {
      const campaigns =
        await this.flashSaleCampaignsService.getActiveCampaigns();
      if (campaigns.length) {
        this.flashSaleCampaignsService.attachFlashInfo(products, campaigns);
      }
    }
    return cart;
  }

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
            return this.withFlashSale(cart);
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

    return this.withFlashSale(cart);
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

  /** Abandoned-cart summary for the admin dashboard: carts that still hold
   * items, were last touched over 24h ago, and whose user never checked out
   * afterwards. Carts are lazily created for every user, so empty ones are
   * excluded via the item join. */
  async getAbandonedSummary(): Promise<{
    abandonedCarts: number;
    abandonedValue: number;
  }> {
    const result: Record<string, string>[] = await this.cartRepo.query(
      `SELECT COUNT(*) AS abandoned_carts,
              COALESCE(SUM(cart_totals.value), 0) AS abandoned_value
       FROM (
         SELECT c.id,
                SUM(ci.quantity * p."sellingPrice") AS value
         FROM cart c
         JOIN cart_item ci ON ci."cartId" = c.id
         JOIN product p ON p.id = ci."productId"
         WHERE c."updatedAt" < NOW() - INTERVAL '24 hours'
           AND NOT EXISTS (
             SELECT 1 FROM "order" o
             WHERE o."userId" = c."userId"
               AND o."createdAt" >= c."updatedAt"
           )
         GROUP BY c.id
       ) cart_totals`,
    );

    const row = result[0] ?? {};
    return {
      abandonedCarts: parseInt(row.abandoned_carts, 10) || 0,
      abandonedValue: parseFloat(row.abandoned_value) || 0,
    };
  }

  /** Paginated list of abandoned carts for the admin report page — same
   * definition as getAbandonedSummary, with per-cart detail rows. */
  async getAbandonedReport(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    summary: { abandonedCarts: number; abandonedValue: number };
    items: Array<{
      cartId: number;
      userName: string | null;
      mobileNumber: string | null;
      itemCount: number;
      value: number;
      updatedAt: Date;
    }>;
    total: number;
  }> {
    const baseWhere = `c."updatedAt" < NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM "order" o
        WHERE o."userId" = c."userId"
          AND o."createdAt" >= c."updatedAt"
      )`;

    const [summary, countResult, items] = await Promise.all([
      this.getAbandonedSummary(),
      this.cartRepo.query(
        `SELECT COUNT(DISTINCT c.id) AS total
         FROM cart c
         JOIN cart_item ci ON ci."cartId" = c.id
         WHERE ${baseWhere}`,
      ),
      this.cartRepo.query(
        `SELECT c.id, c."updatedAt", u.name AS user_name, u."mobileNumber",
                SUM(ci.quantity) AS item_count,
                SUM(ci.quantity * p."sellingPrice") AS value
         FROM cart c
         JOIN "user" u ON u.id = c."userId"
         JOIN cart_item ci ON ci."cartId" = c.id
         JOIN product p ON p.id = ci."productId"
         WHERE ${baseWhere}
         GROUP BY c.id, c."updatedAt", u.name, u."mobileNumber"
         ORDER BY c."updatedAt" DESC
         LIMIT $1 OFFSET $2`,
        [limit, (page - 1) * limit],
      ),
    ]);

    return {
      summary,
      total: parseInt(countResult[0]?.total, 10) || 0,
      items: items.map((r) => ({
        cartId: parseInt(r.id, 10),
        userName: r.user_name ?? null,
        mobileNumber: r.mobileNumber ?? null,
        itemCount: parseInt(r.item_count, 10) || 0,
        value: parseFloat(r.value) || 0,
        updatedAt: r.updatedAt,
      })),
    };
  }
}