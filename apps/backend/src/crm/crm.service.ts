import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  CrmActivityStatus,
  CrmCampaignChannel,
  CrmCampaignRecipientStatus,
  CrmCampaignStatus,
  CrmSegment,
} from 'src/common/enums';
import { Address } from 'src/address/entities/address.entity';
import { BusinessSetting } from 'src/business-settings/entities/business-setting.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { ContactMessage } from 'src/contact-message/entities/contact-message.entity';
import { Order } from 'src/order/entities/order.entity';
import { ProductReview } from 'src/product-review/entities/product-review.entity';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import { User } from 'src/user/entities/user.entity';
import { SmsService } from 'src/auth/sms.service';
import { EmailService } from 'src/email/email.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CrmCustomersQueryDto } from './dto/crm-customers-query.dto';
import { CrmActivity } from './entities/crm-activity.entity';
import { CrmCampaign } from './entities/crm-campaign.entity';
import { CrmCampaignRecipient } from './entities/crm-campaign-recipient.entity';

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

/** Swap {{name}} in a campaign message for the customer's first name. */
function personalizeMessage(message: string, fullName?: string | null): string {
  const firstName = (fullName ?? '').trim().split(/\s+/)[0] ?? '';
  return message.replace(/\{\{\s*name\s*\}\}/g, firstName);
}

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
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(BusinessSetting)
    private businessSettingsRepository: Repository<BusinessSetting>,
    @InjectRepository(CrmCampaign)
    private crmCampaignRepository: Repository<CrmCampaign>,
    @InjectRepository(CrmCampaignRecipient)
    private crmCampaignRecipientRepository: Repository<CrmCampaignRecipient>,
    private smsService: SmsService,
    private emailService: EmailService,
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
  ) {}

  /**
   * Effective CRM segment rules: values saved in Business Settings, falling
   * back to the code defaults in CRM_SEGMENT_RULES for anything unset.
   * Also served to admins via GET crm/segment-rules.
   */
  async getSegmentRules() {
    const settings = await this.businessSettingsRepository.findOne({
      where: { id: 1 },
    });
    return {
      vipMinSpent: settings?.vipMinSpent ?? CRM_SEGMENT_RULES.VIP_MIN_SPENT,
      vipMinOrders: settings?.vipMinOrders ?? CRM_SEGMENT_RULES.VIP_MIN_ORDERS,
      atRiskDays: settings?.atRiskDays ?? CRM_SEGMENT_RULES.AT_RISK_DAYS,
      newDays: settings?.newDays ?? CRM_SEGMENT_RULES.NEW_DAYS,
    };
  }

  private async getSegmentParams() {
    const rules = await this.getSegmentRules();
    return {
      vipMinSpent: rules.vipMinSpent,
      vipMinOrders: rules.vipMinOrders,
      atRiskDays: rules.atRiskDays,
      newDays: rules.newDays,
    };
  }

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
    const segmentParams = await this.getSegmentParams();
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
      .setParameters(segmentParams)
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
      area: null as string | null,
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

    // Attach the area from each customer's default address. Kept as a second
    // query on purpose — joining addresses into the aggregate above would
    // multiply order rows and inflate the SUM/COUNT.
    const pageIds = data.map((customer) => customer.id);
    if (pageIds.length > 0) {
      const addresses = await this.addressRepository.find({
        where: { userId: In(pageIds) },
      });
      const defaultByUser = new Map<number, Address>();
      for (const address of addresses) {
        const current = defaultByUser.get(address.userId);
        if (!current || (address.isDefault && !current.isDefault)) {
          defaultByUser.set(address.userId, address);
        }
      }
      for (const customer of data) {
        customer.area = defaultByUser.get(customer.id)?.area ?? null;
      }
    }

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
   * All customers matching the list filters, unpaged — for CSV export.
   */
  async exportCustomers(query: CrmCustomersQueryDto) {
    const { total } = await this.getCustomers({ ...query, limit: 1 });
    const result = await this.getCustomers({
      ...query,
      page: 1,
      limit: Math.max(total, 1),
    });
    return result.data;
  }

  /**
   * Segment-targeted bulk outreach (SMS or email).
   */
  async createCampaign(dto: CreateCampaignDto, adminUserId: number) {
    const campaign = this.crmCampaignRepository.create({
      name: dto.name.trim(),
      channel: dto.channel,
      segment: dto.segment ?? null,
      subject:
        dto.channel === CrmCampaignChannel.EMAIL
          ? dto.subject?.trim() || null
          : null,
      message: dto.message,
      createdBy: { id: adminUserId } as User,
    });
    return this.crmCampaignRepository.save(campaign);
  }

  async getCampaigns(query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const [data, total] =
      await this.crmCampaignRepository.findAndCount({
        where: {},
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['createdBy'],
      });
    return {
      message: 'CRM campaigns retrieved successfully',
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getCampaign(id: number) {
    const campaign = await this.crmCampaignRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    const [recipients, currentCount] = await Promise.all([
      this.crmCampaignRecipientRepository.find({
        where: { campaignId: id },
        order: { id: 'ASC' },
        take: 100,
      }),
      this.crmCampaignRecipientRepository.count({ where: { campaignId: id } }),
    ]);
    return {
      message: 'Campaign retrieved successfully',
      statusCode: 200,
      data: { campaign, recipients, recipientTotal: currentCount },
    };
  }

  /**
   * How many customers a campaign to this segment would reach, plus a small
   * sample — used by the compose form before sending.
   */
  async previewCampaignRecipients(segment?: CrmSegment) {
    const { total, data } = await this.getCustomers({
      page: 1,
      limit: 5,
      segment,
    });
    return {
      message: 'Campaign recipients preview retrieved successfully',
      statusCode: 200,
      data: {
        count: total,
        sample: data.map((customer) => ({
          id: customer.id,
          name: customer.name,
          mobileNumber: customer.mobileNumber,
          email: customer.email,
        })),
      },
    };
  }

  /**
   * Queue a campaign for delivery. Resolves the segment's customers now,
   * snapshots contact details into recipient rows, then delivers in the
   * background so the HTTP request returns immediately.
   */
  async sendCampaign(id: number) {
    const campaign = await this.crmCampaignRepository.findOne({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    if (campaign.status !== CrmCampaignStatus.DRAFT) {
      throw new BadRequestException(
        `Campaign is ${campaign.status} — only drafts can be sent`,
      );
    }

    const { data: customers } = await this.getCustomers({
      page: 1,
      limit: 100000,
      segment: campaign.segment ?? undefined,
    });
    if (customers.length === 0) {
      throw new BadRequestException('No customers match this segment');
    }

    const recipients = customers.map((customer) =>
      this.crmCampaignRecipientRepository.create({
        campaignId: campaign.id,
        userId: customer.id,
        name: customer.name,
        phone: customer.mobileNumber,
        email: customer.email,
      }),
    );
    await this.crmCampaignRecipientRepository.save(recipients);

    campaign.status = CrmCampaignStatus.SENDING;
    campaign.totalRecipients = recipients.length;
    await this.crmCampaignRepository.save(campaign);

    // Background delivery — returns "queued" immediately.
    void this.deliverCampaign(campaign.id);

    return {
      message: 'Campaign queued for delivery',
      statusCode: 200,
      data: { queued: true, totalRecipients: recipients.length },
    };
  }

  async deleteCampaign(id: number) {
    const campaign = await this.crmCampaignRepository.findOne({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    await this.crmCampaignRepository.remove(campaign);
    return {
      message: 'Campaign deleted successfully',
      statusCode: 200,
    };
  }

  /** Serial delivery with a small per-SMS pause so the gateway stays happy. */
  private async deliverCampaign(campaignId: number) {
    const campaign = await this.crmCampaignRepository.findOne({
      where: { id: campaignId },
    });
    if (!campaign) return;

    let sent = 0;
    let failed = 0;
    const recipients = await this.crmCampaignRecipientRepository.find({
      where: { campaignId },
      order: { id: 'ASC' },
    });

    for (const recipient of recipients) {
      try {
        if (campaign.channel === CrmCampaignChannel.SMS) {
          if (!recipient.phone) {
            recipient.status = CrmCampaignRecipientStatus.SKIPPED;
            recipient.error = 'No mobile number on profile';
            failed++;
          } else {
            const text = personalizeMessage(campaign.message, recipient.name);
            const ok = await this.smsService.sendSms(
              recipient.phone,
              text,
              'CRM Campaign',
            );
            recipient.status = ok
              ? CrmCampaignRecipientStatus.SENT
              : CrmCampaignRecipientStatus.FAILED;
            if (!ok) recipient.error = 'SMS gateway rejected the number';
            if (ok) sent++;
            else failed++;
          }
        } else {
          if (!recipient.email) {
            recipient.status = CrmCampaignRecipientStatus.SKIPPED;
            recipient.error = 'No email on profile';
            failed++;
          } else {
            const text = personalizeMessage(campaign.message, recipient.name);
            await this.emailService.sendCampaignEmail(
              recipient.email,
              recipient.name ?? 'Customer',
              campaign.subject ?? campaign.name,
              text,
            );
            recipient.status = CrmCampaignRecipientStatus.SENT;
            sent++;
          }
        }
      } catch (error) {
        recipient.status = CrmCampaignRecipientStatus.FAILED;
        recipient.error = (error as Error).message?.slice(0, 500);
        failed++;
      }
      recipient.sentAt = new Date();
      await this.crmCampaignRecipientRepository.save(recipient);
    }

    campaign.sentCount = sent;
    campaign.failedCount = failed;
    campaign.status =
      sent > 0 ? CrmCampaignStatus.SENT : CrmCampaignStatus.FAILED;
    campaign.sentAt = new Date();
    await this.crmCampaignRepository.save(campaign);
    // Individual saves keep the per-recipient log accurate; totals are
    // written once at the end. With ~4k recipients this takes minutes for
    // SMS (100 ms pause each) — that's the rate-limit safety valve.
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

    const segmentParams = await this.getSegmentParams();

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
        .setParameters(segmentParams)
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
   * CRM landing-page stats.
   */
  async getDashboard() {
    const segmentParams = await this.getSegmentParams();
    const segmentRules = await this.getSegmentRules();

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

      // Segment distribution: segment per user (aggregates are fine in
      // SELECT with GROUP BY user.id), tallied in JS — Postgres does not
      // allow aggregate expressions in GROUP BY itself.
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .leftJoin('user.orders', 'orders', "orders.orderStatus = 'delivered'")
        .select('user.id', 'id')
        .addSelect(SEGMENT_CASE, 'segment')
        .where('role.id = :roleId', { roleId: CUSTOMER_ROLE_ID })
        .setParameters(segmentParams)
        .groupBy('user.id')
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
          minDays: segmentRules.atRiskDays,
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
      // Customers created within the New-customer window.
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .where('role.id = :roleId', { roleId: CUSTOMER_ROLE_ID })
        .andWhere(
          'user.createdAt >= NOW() - MAKE_INTERVAL(days => :newDays)',
          { newDays: segmentRules.newDays },
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
        segments[row.segment] += 1;
      }
    }

    // Bare payload — the controller wraps it in the response envelope.
    return {
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
    };
  }
}
