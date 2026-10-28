import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CrmActivityStatus, CrmSegment } from 'src/common/enums';
import { Cart } from 'src/cart/entities/cart.entity';
import { ContactMessage } from 'src/contact-message/entities/contact-message.entity';
import { Order } from 'src/order/entities/order.entity';
import { ProductReview } from 'src/product-review/entities/product-review.entity';
import { OnlineUsersService } from 'src/online-users/online-users.service';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import { User } from 'src/user/entities/user.entity';
import { AbandonedCartsQueryDto } from './dto/abandoned-carts-query.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CrmCustomersQueryDto } from './dto/crm-customers-query.dto';
import { CrmActivity } from './entities/crm-activity.entity';

/** RFM thresholds — surfaced on the frontend so admins see the same rules. */
export const CRM_SEGMENT_RULES = {
  VIP_MIN_SPENT: 20000,
  VIP_MIN_ORDERS: 10,
  AT_RISK_DAYS: 90,
  NEW_DAYS: 30,
};

const CUSTOMER_ROLE_ID = 3;

/**
 * Segment CASE over RFM aggregates — aggregate-only expressions, so the same
 * text is valid in SELECT and HAVING. Params are bound by the caller.
 */
const SEGMENT_CASE = `
    CASE
      WHEN COUNT(DISTINCT "orders"."id") >= :vipMinOrders
        OR COALESCE(SUM("orders"."totalValue"), 0) >= :vipMinSpent THEN '${CrmSegment.VIP}'
      WHEN COUNT(DISTINCT "orders"."id") > 0
        AND MAX("orders"."createdAt") < NOW() - MAKE_INTERVAL(days => :atRiskDays) THEN '${CrmSegment.AT_RISK}'
      WHEN COUNT(DISTINCT "orders"."id") <= 1
        AND MAX("user"."createdAt") >= NOW() - MAKE_INTERVAL(days => :newDays) THEN '${CrmSegment.NEW}'
      WHEN COUNT(DISTINCT "orders"."id") = 0 THEN '${CrmSegment.INACTIVE}'
      ELSE '${CrmSegment.LOYAL}'
    END`;

const SEGMENT_PARAMS = {
  vipMinSpent: CRM_SEGMENT_RULES.VIP_MIN_SPENT,
  vipMinOrders: CRM_SEGMENT_RULES.VIP_MIN_ORDERS,
  atRiskDays: CRM_SEGMENT_RULES.AT_RISK_DAYS,
  newDays: CRM_SEGMENT_RULES.NEW_DAYS,
};

/**
 * SQL mirror of Product.salePrice (a computed getter — there is no such
 * column): sellingPrice minus the discount, but only while the discount
 * window is active. Keep in sync with the getter in product.entity.ts.
 */
const SALE_PRICE_SQL = `
  CASE
    WHEN "product"."discountType" = 'percentage'
      AND "product"."discountValue" > 0
      AND ("product"."discountStartDate" IS NULL OR NOW() >= "product"."discountStartDate")
      AND ("product"."discountEndDate" IS NULL OR NOW() <= "product"."discountEndDate")
      THEN GREATEST(0, ROUND("product"."sellingPrice" * (1 - "product"."discountValue" / 100.0), 2))
    WHEN "product"."discountType" = 'fixed'
      AND "product"."discountValue" > 0
      AND ("product"."discountStartDate" IS NULL OR NOW() >= "product"."discountStartDate")
      AND ("product"."discountEndDate" IS NULL OR NOW() <= "product"."discountEndDate")
      THEN GREATEST(0, ROUND("product"."sellingPrice" - "product"."discountValue", 2))
    ELSE "product"."sellingPrice"
  END`;

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CrmActivity)
    private crmActivityRepository: Repository<CrmActivity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(ProductReview)
    private productReviewRepository: Repository<ProductReview>,
    @InjectRepository(ContactMessage)
    private contactMessageRepository: Repository<ContactMessage>,
    private onlineUsersService: OnlineUsersService,
  ) {}

  /**
   * Paginated customer list with RFM stats and segment per row.
   * Segments are computed on the fly — no stored state to go stale.
   */
  async getCustomers(query: CrmCustomersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      segment,
      sortBy = 'total_spent',
      sortOrder = 'DESC',
    } = query;
    // One aggregation query for ALL customers, then filter/sort/paginate in
    // JS: retail customer counts are small, and wrapping the aggregate query
    // in a subquery for SQL-side paging is not worth the fragility.
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin('user.orders', 'orders', "orders.orderStatus = 'delivered'")
      .leftJoin('user.profilePhoto', 'profilePhoto')
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('user.mobileNumber', 'mobileNumber')
      .addSelect('user.isVerified', 'isVerified')
      .addSelect('user.createdAt', 'createdAt')
      .addSelect('user.lastLoginAt', 'lastLoginAt')
      .addSelect('profilePhoto.id', 'profilePhotoId')
      .addSelect('profilePhoto.url', 'profilePhotoUrl')
      .addSelect('COUNT(DISTINCT "orders"."id")', 'orderCount')
      .addSelect('COALESCE(SUM("orders"."totalValue"), 0)', 'totalSpent')
      .addSelect('COALESCE(AVG("orders"."totalValue"), 0)', 'averageOrderValue')
      .addSelect('MAX("orders"."createdAt")', 'lastOrderAt')
      .addSelect(SEGMENT_CASE, 'segment')
      .where('role.id = :roleId', { roleId: CUSTOMER_ROLE_ID })
      .setParameters(SEGMENT_PARAMS)
      .groupBy('user.id')
      .addGroupBy('profilePhoto.id');

    if (search) {
      qb.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.mobileNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const rows = await qb.getRawMany();

    let customers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      mobileNumber: row.mobileNumber,
      isVerified: row.isVerified,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
      profilePhoto: row.profilePhotoId
        ? { id: row.profilePhotoId, url: row.profilePhotoUrl }
        : null,
      rfm: {
        orderCount: parseInt(row.orderCount, 10) || 0,
        totalSpent: parseFloat(row.totalSpent) || 0,
        averageOrderValue: parseFloat(row.averageOrderValue) || 0,
        lastOrderAt: row.lastOrderAt ?? null,
      },
      segment: row.segment,
    }));

    if (segment) {
      customers = customers.filter((customer) => customer.segment === segment);
    }

    const dir = sortOrder === 'ASC' ? 1 : -1;
    const comparePrimary = (a: (typeof customers)[number], b: (typeof customers)[number]) => {
      switch (sortBy) {
        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '');
        case 'order_count':
          return a.rfm.orderCount - b.rfm.orderCount;
        case 'last_order_at': {
          const ta = a.rfm.lastOrderAt
            ? new Date(a.rfm.lastOrderAt).getTime()
            : 0;
          const tb = b.rfm.lastOrderAt
            ? new Date(b.rfm.lastOrderAt).getTime()
            : 0;
          return ta - tb;
        }
        default:
          return a.rfm.totalSpent - b.rfm.totalSpent;
      }
    };
    customers.sort((a, b) => {
      const primary = comparePrimary(a, b);
      // Tie-break by id so paging order stays stable across pages.
      return primary !== 0 ? dir * primary : a.id - b.id;
    });

    const total = customers.length;
    const data = customers.slice((page - 1) * limit, page * limit);

    return {
      message: 'CRM customers retrieved successfully',
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Everything we know about one customer, in one payload.
   */
  async getCustomer360(id: number) {
    const user = await this.userRepository.findOne({
      where: { id, role: { id: CUSTOMER_ROLE_ID } },
      relations: ['profilePhoto', 'addresses'],
    });
    if (!user) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const [
      rfmRow,
      recentOrders,
      cart,
      wishlist,
      reviews,
      messages,
      activities,
    ] = await Promise.all([
      // Same RFM aggregation as the list, narrowed to one user.
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .leftJoin('user.orders', 'orders', "orders.orderStatus = 'delivered'")
        .select('COUNT(DISTINCT "orders"."id")', 'order_count')
        .addSelect('COALESCE(SUM("orders"."totalValue"), 0)', 'total_spent')
        .addSelect('COALESCE(AVG("orders"."totalValue"), 0)', 'average_order_value')
        .addSelect('MAX("orders"."createdAt")', 'last_order_at')
        .addSelect(SEGMENT_CASE, 'segment')
        .where('user.id = :id', { id })
        .setParameters(SEGMENT_PARAMS)
        .getRawOne(),
      // Recent orders.
      this.orderRepository.find({
        where: { user: { id } },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      // Cart with items + products (cart always exists per user in this app).
      this.cartRepository.findOne({
        where: { user: { id } },
        relations: ['items', 'items.product'],
      }),
      this.wishlistRepository.findOne({
        where: { user: { id } },
        relations: ['items', 'items.product'],
      }),
      this.productReviewRepository.find({
        where: { user: { id } },
        relations: ['product'],
        take: 10,
        order: { createdAt: 'DESC' },
      }),
      this.contactMessageRepository.find({
        where: { userId: id },
        take: 10,
        order: { createdAt: 'DESC' },
      }),
      this.crmActivityRepository.find({
        where: { userId: id },
        relations: ['createdBy'],
        take: 20,
        order: { createdAt: 'DESC' },
      }),
    ]);

    const rfm = {
      orderCount: parseInt(rfmRow?.order_count, 10) || 0,
      totalSpent: parseFloat(rfmRow?.total_spent) || 0,
      averageOrderValue: parseFloat(rfmRow?.average_order_value) || 0,
      lastOrderAt: rfmRow?.last_order_at ?? null,
      segment: rfmRow?.segment ?? CrmSegment.INACTIVE,
    };

    return {
      message: 'Customer 360 retrieved successfully',
      statusCode: 200,
      data: {
        profile: user,
        rfm,
        recentOrders,
        cart,
        wishlist,
        reviews,
        messages,
        activities,
      },
    };
  }

  /**
   * Paginated activities for one customer.
   */
  async getActivities(
    userId: number,
    query: { page?: number; limit?: number; type?: string; status?: string },
  ) {
    const { page = 1, limit = 10, type, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.crmActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.createdBy', 'createdBy')
      .where('activity.userId = :userId', { userId });

    if (type) {
      qb.andWhere('activity.type = :type', { type });
    }
    if (status) {
      qb.andWhere('activity.status = :status', { status });
    }
    qb.orderBy('activity.createdAt', 'DESC')
      .offset(skip)
      .limit(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      message: 'CRM activities retrieved successfully',
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Create a note/task/call/email log for a customer.
   */
  async createActivity(
    userId: number,
    dto: CreateActivityDto,
    adminUserId: number,
  ) {
    const customer = await this.userRepository.findOne({
      where: { id: userId, role: { id: CUSTOMER_ROLE_ID } },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${userId} not found`);
    }

    const activity = this.crmActivityRepository.create({
      userId,
      createdBy: { id: adminUserId },
      type: dto.type,
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      status: dto.status ?? CrmActivityStatus.OPEN,
      completedAt:
        dto.status === CrmActivityStatus.COMPLETED ? new Date() : null,
    });

    return this.crmActivityRepository.save(activity);
  }

  /**
   * Update an activity. Completing a task stamps completedAt.
   */
  async updateActivity(id: number, dto: UpdateActivityDto) {
    const activity = await this.crmActivityRepository.findOne({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException(`CRM activity with ID ${id} not found`);
    }

    if (dto.status === CrmActivityStatus.COMPLETED && !activity.completedAt) {
      activity.completedAt = new Date();
    }
    if (dto.status === CrmActivityStatus.OPEN) {
      activity.completedAt = null;
    }
    delete (dto as Record<string, unknown>).status;

    Object.assign(activity, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : activity.dueDate,
    });
    return this.crmActivityRepository.save(activity);
  }

  async removeActivity(id: number) {
    const activity = await this.crmActivityRepository.findOne({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException(`CRM activity with ID ${id} not found`);
    }
    await this.crmActivityRepository.remove(activity);
  }

  /**
   * Carts that sat untouched for `minDays` with items still in them.
   * "Abandoned" is inferred — carts have no flag; carts belonging to users
   * who are online right now are excluded unless `includeOnline`.
   */
  async getAbandonedCarts(query: AbandonedCartsQueryDto) {
    const {
      page = 1,
      limit = 10,
      minItems = 1,
      minDays = 3,
      includeOnline = false,
    } = query;
    const skip = (page - 1) * limit;

    const buildBase = () =>
      this.cartRepository
        .createQueryBuilder('cart')
        .innerJoin('cart.user', 'user')
        .innerJoin('user.role', 'role', 'role.id = :roleId', {
          roleId: CUSTOMER_ROLE_ID,
        })
        .innerJoin('cart.items', 'item')
        .leftJoin('item.product', 'product')
        .select('cart.id', 'cart_id')
        .addSelect('user.id', 'user_id')
        .addSelect('user.name', 'name')
        .addSelect('user.email', 'email')
        .addSelect('user.mobileNumber', 'mobile_number')
        .addSelect('cart.updatedAt', 'last_activity_at')
        .addSelect('COUNT(item.id)', 'item_count')
        .addSelect(
          `COALESCE(SUM(${SALE_PRICE_SQL} * "item"."quantity"), 0)`,
          'cart_value',
        )
        .where('cart.updatedAt < NOW() - MAKE_INTERVAL(days => :minDays)', {
          minDays,
        })
        .groupBy('cart.id')
        .addGroupBy('user.id')
        .having('COUNT(item.id) >= :minItems', { minItems });

    // Fetch extra candidates so filtering out online users still fills a page.
    const fetchLimit = includeOnline ? limit : limit * 2 + 50;
    const rows = await buildBase()
      .orderBy('cart.updatedAt', 'DESC')
      .offset(skip)
      .limit(fetchLimit)
      .getRawMany();

    const onlineIds = includeOnline
      ? new Set<number>()
      : this.onlineUsersService.getOnlineUserIds();
    const filtered = includeOnline
      ? rows
      : rows.filter((row) => !onlineIds.has(row.user_id));

    const data = filtered.slice(0, limit).map((row) => ({
      cartId: row.cart_id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      mobileNumber: row.mobile_number,
      itemCount: parseInt(row.item_count, 10) || 0,
      cartValue: parseFloat(row.cart_value) || 0,
      lastActivityAt: row.last_activity_at,
      isOnline: onlineIds.has(row.user_id),
    }));

    return {
      message: 'Abandoned carts retrieved successfully',
      statusCode: 200,
      data,
      total: rows.length,
      page,
      limit,
      totalPages: Math.ceil(rows.length / limit) || 1,
    };
  }

  /**
   * CRM landing-page stats.
   */
  async getDashboard() {
    const [
      totalCustomers,
      segmentRows,
      abandonedRow,
      openTasks,
      overdueTasks,
      newCustomers,
      recentActivities,
      vipCustomers,
    ] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .where('role.id = :roleId', { roleId: CUSTOMER_ROLE_ID })
        .getCount(),

      // Segment distribution: one row per computed segment.
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .leftJoin('user.orders', 'orders', "orders.orderStatus = 'delivered'")
        .select(SEGMENT_CASE, 'segment')
        .addSelect('COUNT(DISTINCT user.id)', 'count')
        .where('role.id = :roleId', { roleId: CUSTOMER_ROLE_ID })
        .setParameters(SEGMENT_PARAMS)
        .groupBy(SEGMENT_CASE)
        .getRawMany(),

      // Same criteria as the abandoned-carts list (defaults).
      this.cartRepository
        .createQueryBuilder('cart')
        .innerJoin('cart.user', 'user')
        .innerJoin('user.role', 'role', 'role.id = :roleId', {
          roleId: CUSTOMER_ROLE_ID,
        })
        .innerJoin('cart.items', 'item')
        .innerJoin('item.product', 'product')
        .where('cart.updatedAt < NOW() - MAKE_INTERVAL(days => :minDays)', {
          minDays: CRM_SEGMENT_RULES.AT_RISK_DAYS,
        })
        .select('COUNT(DISTINCT cart.id)', 'cart_count')
        .addSelect(
          `COALESCE(SUM(${SALE_PRICE_SQL} * "item"."quantity"), 0)`,
          'cart_value',
        )
        .getRawOne(),

      this.crmActivityRepository.count({
        where: { status: CrmActivityStatus.OPEN },
      }),
      this.crmActivityRepository.count({
        where: {
          status: CrmActivityStatus.OPEN,
          dueDate: LessThan(new Date()),
        },
      }),
      // Customers created in the last 30 days.
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .where('role.id = :roleId', { roleId: CUSTOMER_ROLE_ID })
        .andWhere(
          'user.createdAt >= NOW() - MAKE_INTERVAL(days => :newDays)',
          { newDays: CRM_SEGMENT_RULES.NEW_DAYS },
        )
        .getCount(),

      this.crmActivityRepository.count({
        where: {
          createdAt: MoreThanOrEqual(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ),
        },
      }),

      this.getCustomers({
        page: 1,
        limit: 5,
        segment: CrmSegment.VIP,
        sortBy: 'total_spent',
        sortOrder: 'DESC',
      }),
    ]);

    const segments = {
      vip: 0,
      loyal: 0,
      at_risk: 0,
      new: 0,
      inactive: 0,
    };
    for (const row of segmentRows) {
      if (row.segment in segments) {
        segments[row.segment] = parseInt(row.count, 10) || 0;
      }
    }

    return {
      message: 'CRM dashboard retrieved successfully',
      statusCode: 200,
      data: {
        totalCustomers,
        newCustomers,
        segments,
        abandonedCarts: {
          count: parseInt(abandonedRow?.cart_count, 10) || 0,
          totalValue: parseFloat(abandonedRow?.cart_value) || 0,
        },
        tasks: {
          open: openTasks,
          overdue: overdueTasks,
        },
        activitiesLast7Days: recentActivities,
        topCustomers: vipCustomers.data,
      },
    };
  }
}
