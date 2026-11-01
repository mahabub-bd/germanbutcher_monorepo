import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { BogoCampaignsService } from 'src/bogo-campaigns/bogo-campaigns.service';
import {
  FlashSaleCampaignsService,
} from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
import { EmailService } from 'src/email/email.service';
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
    private readonly bogoCampaignsService: BogoCampaignsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /** Attach flash-sale pricing + BOGO info to every product in the cart so
   * the storefront cart/checkout show the same price and deals the order
   * service will apply. Display-only props; the cart itself is never saved
   * after this. */
  private async withFlashSale(cart: Cart): Promise<Cart> {
    const products = (cart.items ?? [])
      .map((item) => item.product)
      .filter(Boolean);
    if (products.length) {
      const [campaigns, bogoCampaigns] = await Promise.all([
        this.flashSaleCampaignsService.getActiveCampaigns(),
        this.bogoCampaignsService.getActiveCampaigns(),
      ]);
      if (campaigns.length) {
        this.flashSaleCampaignsService.attachFlashInfo(products, campaigns);
      }
      if (bogoCampaigns.length) {
        this.bogoCampaignsService.attachBogoInfo(products, bogoCampaigns);
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

    // Inactive products must not be addable (e.g. stale links / search engines)
    if (!product.isActive) {
      throw new BadRequestException(
        `${product.name} is no longer available.`,
      );
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
    search?: string,
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

    // Escape LIKE wildcards so a user-typed % or _ matches literally. The
    // placeholder index differs per query: the count query has no other
    // binds, the items query binds limit/offset first.
    const searchClause = (paramIndex: number) =>
      search
        ? `AND (u.name ILIKE $${paramIndex} OR u."mobileNumber" ILIKE $${paramIndex})`
        : '';
    const searchParam = search
      ? [`%${search.replace(/[\\%_]/g, '\\$&')}%`]
      : [];

    const [summary, countResult, items] = await Promise.all([
      this.getAbandonedSummary(),
      this.cartRepo.query(
        `SELECT COUNT(DISTINCT c.id) AS total
         FROM cart c
         JOIN "user" u ON u.id = c."userId"
         WHERE ${baseWhere}
           ${searchClause(1)}`,
        [...searchParam],
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
           ${searchClause(3)}
         GROUP BY c.id, c."updatedAt", u.name, u."mobileNumber"
         ORDER BY c."updatedAt" DESC
         LIMIT $1 OFFSET $2`,
        [limit, (page - 1) * limit, ...searchParam],
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

  /** Single abandoned cart with its line items for the details page. Uses the
   * same abandonment definition as getAbandonedReport; a cart that no longer
   * qualifies (checked out / recent activity) or does not exist throws 404. */
  async getAbandonedCartDetail(cartId: number): Promise<{
    cartId: number;
    userId: number;
    userName: string | null;
    mobileNumber: string | null;
    email: string | null;
    updatedAt: Date;
    itemCount: number;
    subtotal: number;
    items: Array<{
      cartItemId: number;
      productId: number;
      name: string;
      slug: string | null;
      imageUrl: string | null;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      stock: number;
    }>;
  }> {
    const rows: Record<string, string>[] = await this.cartRepo.query(
      `SELECT c.id AS "cartId", c."userId", c."updatedAt",
              u.name AS "userName", u."mobileNumber", u.email AS "email",
              ci.id AS "cartItemId",
              p.id AS "productId", p.name AS "productName", p.slug AS "productSlug",
              p."sellingPrice" AS "unitPrice", p.stock AS "stock",
              ci.quantity AS "quantity",
              a.url AS "imageUrl"
       FROM cart c
       JOIN "user" u ON u.id = c."userId"
       JOIN cart_item ci ON ci."cartId" = c.id
       JOIN product p ON p.id = ci."productId"
       LEFT JOIN attachment a ON a.id = p."attachmentId"
       WHERE c.id = $1
         AND c."updatedAt" < NOW() - INTERVAL '24 hours'
         AND NOT EXISTS (
           SELECT 1 FROM "order" o
           WHERE o."userId" = c."userId"
             AND o."createdAt" >= c."updatedAt"
         )
       ORDER BY ci.id ASC`,
      [cartId],
    );

    if (!rows.length) {
      throw new NotFoundException('Abandoned cart not found');
    }

    const items = rows.map((r) => {
      const unitPrice = parseFloat(r.unitPrice) || 0;
      const quantity = parseInt(r.quantity, 10) || 0;
      return {
        cartItemId: parseInt(r.cartItemId, 10),
        productId: parseInt(r.productId, 10),
        name: r.productName,
        slug: r.productSlug ?? null,
        imageUrl: r.imageUrl ?? null,
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
        stock: parseInt(r.stock, 10) || 0,
      };
    });

    const head = rows[0];
    return {
      cartId: parseInt(head.cartId, 10),
      userId: parseInt(head.userId, 10),
      userName: head.userName ?? null,
      mobileNumber: head.mobileNumber ?? null,
      email: head.email ?? null,
      updatedAt: new Date(head.updatedAt),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
      items,
    };
  }

  /** Sends the abandoned-cart reminder email to the cart's customer. Reuses
   * the same abandonment definition as the report/detail views, so a cart
   * that has since checked out or been cleared 404s instead of emailing a
   * customer about a cart they already completed. Returns the recipient. */
  async sendAbandonedCartReminder(cartId: number): Promise<{ sentTo: string }> {
    const detail = await this.getAbandonedCartDetail(cartId);

    if (!detail.email) {
      throw new BadRequestException(
        'This customer has no email address on file — reach out by phone instead.',
      );
    }

    const frontendUrl =
      this.configService.get<string>('frontendUrl') ||
      'https://www.germanbutcherbd.com';
    await this.emailService.sendAbandonedCartReminderEmail({
      customerName: detail.userName || 'Customer',
      customerEmail: detail.email,
      items: detail.items.map((item) => ({
        lineTotal: item.lineTotal,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal: detail.subtotal,
      cartUrl: `${frontendUrl}/cart`,
    });

    return { sentTo: detail.email };
  }
}