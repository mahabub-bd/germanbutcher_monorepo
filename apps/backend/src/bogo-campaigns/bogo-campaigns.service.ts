import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BogoUsageLogService } from 'src/bogo-usage-log/bogo-usage-log.service';
import { Category } from 'src/category/entities/category.entity';
import { SwrCache } from 'src/common/utils/swr-cache';
import {
  computeFlashPrice,
  FlashSaleCampaignsService,
} from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
import { Product } from 'src/product/entities/product.entity';
import { CreateBogoCampaignDto } from './dto/create-bogo-campaign.dto';
import { UpdateBogoCampaignDto } from './dto/update-bogo-campaign.dto';
import { BogoCampaign } from './entities/bogo-campaign.entity';

/** Minimal product info exposed on the preview response. */
export interface BogoProductSummary {
  id: number;
  name: string;
  slug: string;
}

/** Minimal category info exposed on the preview response. */
export interface BogoCategorySummary {
  id: number;
  name: string;
  slug: string;
}

/** Campaign as returned by the public preview endpoint (no full product/
 * category entities — those leak admin data like user password hashes). */
export type ActiveBogoCampaignSummary = Omit<
  BogoCampaign,
  'products' | 'categories'
> & {
  products: BogoProductSummary[];
  categories: BogoCategorySummary[];
};

/** Product fields the admin card/picker needs — never a full entity (full
 * entities leak supplier/admin data like user password hashes). */
export type AdminBogoCampaignProduct = Pick<
  Product,
  'id' | 'name' | 'slug' | 'sellingPrice'
> & {
  category?: { id: number; name: string } | null;
  attachment?: { id: number | string; url: string } | null;
};

/** Campaign as returned by the admin CRUD endpoints (trimmed relations). */
export type AdminBogoCampaignSummary = Omit<
  BogoCampaign,
  'products' | 'categories'
> & {
  products: AdminBogoCampaignProduct[];
  categories: { id: number; name: string }[];
};

/** Per-line pricing as computed by the order item loop (and the preview). */
export interface BogoPricingDetail {
  productId: number;
  categoryId?: number;
  /** Display name — set by preview() so free lines can be labeled. */
  productName?: string;
  quantity: number;
  unitPrice: number;
  unitDiscount: number;
  totalPrice: number;
}

/** One product line the campaign made free on this order. */
export interface BogoFreeLine {
  productId: number;
  quantity: number;
  unitPrice: number;
}

/** Which limit reduced a campaign's free units (null = uncapped). */
export type BogoCapLimit = 'per_order' | 'per_user';

/** One campaign's effect on a single order. */
export interface BogoUsage {
  campaign: BogoCampaign;
  discount: number;
  freeUnits: number;
  /** Which product lines the free units came from (product display in cart). */
  freeLines: BogoFreeLine[];
  /** Deal groups the cart could have earned before caps. */
  groupsPotential: number;
  /** Deal groups actually granted after caps. */
  groupsEarned: number;
  /** The cap that reduced the grant, if one did. */
  capLimit: BogoCapLimit;
}

export interface BogoDiscountResult {
  totalDiscount: number;
  usages: BogoUsage[];
}

/**
 * Apply BOGO campaigns to priced order lines. Pure — mutates each detail's
 * `totalPrice` (and rebalances `unitDiscount`) so callers downstream (coupon
 * eligible total, OrderItem rows, totals) see the reduced amounts.
 *
 * Eligible units pool across lines/products; for every
 * (buyQuantity + getQuantity) pooled units, the getQuantity cheapest become
 * free. The ledger guarantees one unit never feeds two campaigns; campaigns
 * run in id order (lowest id claims units first), matching flash sales.
 *
 * `perUserFreeUsed` (campaignId → free units this user already received
 * lifetime) clamps free units to the campaign's `maxFreePerUser` cap; omit
 * it where the cap doesn't apply (admin previews, guest carts).
 */
export function applyBogoDiscount(
  itemPricingDetails: BogoPricingDetail[],
  campaigns: BogoCampaign[],
  perUserFreeUsed?: Map<number, number>,
): BogoDiscountResult {
  const ledger = itemPricingDetails.map((detail) => ({
    detail,
    remaining: detail.quantity,
    bogo: 0,
  }));

  const usages: BogoUsage[] = [];

  for (const campaign of [...campaigns].sort((a, b) => a.id - b.id)) {
    const hasScope =
      (campaign.products?.length ?? 0) > 0 ||
      (campaign.categories?.length ?? 0) > 0;
    const eligible = ledger.filter((line) => {
      if (line.remaining <= 0) return false;
      if (!hasScope) return true;
      return (
        campaign.products?.some(
          (product) => product.id === line.detail.productId,
        ) ||
        (line.detail.categoryId !== undefined &&
          campaign.categories?.some(
            (category) => category.id === line.detail.categoryId,
          ))
      );
    });

    const totalUnits = eligible.reduce(
      (sum, line) => sum + line.remaining,
      0,
    );
    const groupSize = campaign.buyQuantity + campaign.getQuantity;
    const groupsPotential = Math.floor(totalUnits / groupSize);
    let freeUnits = groupsPotential * campaign.getQuantity;
    let capLimit: BogoCapLimit = null;
    // Per-order cap: maxGroupsPerOrder limits how many free groups one
    // order can earn (0 = unlimited)
    const maxGroups = campaign.maxGroupsPerOrder ?? 0;
    if (maxGroups > 0 && freeUnits > maxGroups * campaign.getQuantity) {
      freeUnits = maxGroups * campaign.getQuantity;
      capLimit = 'per_order';
    }
    // Per-user lifetime cap: maxFreePerUser minus what this customer already
    // received from the campaign across all their past orders (0 = unlimited)
    const maxPerUser = campaign.maxFreePerUser ?? 0;
    if (maxPerUser > 0) {
      const used = perUserFreeUsed?.get(campaign.id) ?? 0;
      const allowed = Math.max(maxPerUser - used, 0);
      if (freeUnits > allowed) {
        freeUnits = allowed;
        capLimit = 'per_user';
      }
    }
    if (freeUnits <= 0) continue;

    let discount = 0;
    let left = freeUnits;
    const freeLines: BogoFreeLine[] = [];
    for (const line of [...eligible].sort(
      (a, b) => a.detail.unitPrice - b.detail.unitPrice,
    )) {
      if (left <= 0) break;
      const take = Math.min(line.remaining, left);
      const cost = Math.round(take * Number(line.detail.unitPrice) * 100) / 100;
      discount += cost;
      line.bogo += cost;
      line.remaining -= take;
      left -= take;
      freeLines.push({
        productId: line.detail.productId,
        quantity: take,
        unitPrice: Number(line.detail.unitPrice),
      });
    }

    usages.push({
      campaign,
      discount,
      freeUnits,
      freeLines,
      groupsPotential,
      groupsEarned: Math.floor(freeUnits / campaign.getQuantity),
      capLimit,
    });
  }

  // Write the discount back into the pricing details
  for (const line of ledger) {
    if (line.bogo <= 0) continue;
    const detail = line.detail;
    detail.totalPrice =
      Math.round((Number(detail.totalPrice) - line.bogo) * 100) / 100;
    detail.unitDiscount =
      Math.round(
        ((Number(detail.unitDiscount) * detail.quantity + line.bogo) /
          detail.quantity) *
          100,
      ) / 100;
  }

  const totalDiscount = usages.reduce((sum, usage) => sum + usage.discount, 0);
  return { totalDiscount, usages };
}

@Injectable()
export class BogoCampaignsService {
  private readonly logger = new Logger(BogoCampaignsService.name);

  /**
   * Active campaigns are read on every product-list/cart request, so keep them
   * in process instead of hitting the DB each time. 30s fresh / 5min stale —
   * the same tolerance the old (inert) TypeORM `.cache()` intended, applied to
   * the raw rows here; validFrom/validUntil are re-evaluated per call.
   */
  private readonly activeCache = new SwrCache<BogoCampaign[]>(30_000, 300_000);

  constructor(
    @InjectRepository(BogoCampaign)
    private readonly campaignRepository: Repository<BogoCampaign>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly flashSaleCampaignsService: FlashSaleCampaignsService,
    private readonly bogoUsageLogService: BogoUsageLogService,
  ) {}

  // ----- CRUD -----

  async create(dto: CreateBogoCampaignDto): Promise<AdminBogoCampaignSummary> {
    this.validateDateRange(dto.validFrom, dto.validUntil);
    const { productIds, categoryIds, ...rest } = dto;

    const campaign = this.campaignRepository.create(rest);
    this.assignRelations(campaign, productIds, categoryIds);
    await this.campaignRepository.save(campaign);
    this.activeCache.invalidate();
    return this.findOne(campaign.id);
  }

  async update(
    id: number,
    dto: UpdateBogoCampaignDto,
  ): Promise<AdminBogoCampaignSummary> {
    const campaign = await this.findEntity(id);
    const { validFrom, validUntil, productIds, categoryIds, ...rest } = dto;

    this.validateDateRange(
      validFrom ?? campaign.validFrom?.toISOString(),
      validUntil ?? campaign.validUntil?.toISOString(),
    );

    Object.assign(campaign, rest);
    // Dates were destructured out above (they need null handling), so they
    // must be assigned explicitly.
    if (validFrom !== undefined) {
      campaign.validFrom = validFrom ? new Date(validFrom) : null;
    }
    if (validUntil !== undefined) {
      campaign.validUntil = validUntil ? new Date(validUntil) : null;
    }
    this.assignRelations(campaign, productIds, categoryIds);
    await this.campaignRepository.save(campaign);
    this.activeCache.invalidate();
    return this.findOne(id);
  }

  findAll(): Promise<AdminBogoCampaignSummary[]> {
    return this.campaignRepository
      .find({
        relations: ['products', 'products.attachment', 'categories'],
        order: { id: 'ASC' },
      })
      .then((campaigns) => campaigns.map((c) => this.toAdminSummary(c)));
  }

  async findOne(id: number): Promise<AdminBogoCampaignSummary> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['products', 'products.attachment', 'categories'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return this.toAdminSummary(campaign);
  }

  async remove(id: number): Promise<void> {
    const campaign = await this.findEntity(id);
    await this.campaignRepository.remove(campaign);
    this.activeCache.invalidate();
  }

  /** Raw entity fetch for the mutation paths — findOne() returns a summary. */
  private async findEntity(id: number): Promise<BogoCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['products', 'categories'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  /** Trim nested product/category entities to the fields the admin card and
   * picker need — full entities expose supplier/admin data (incl. password
   * hashes via createdBy/updatedBy). */
  private toAdminSummary(
    campaign: BogoCampaign,
  ): AdminBogoCampaignSummary {
    const { products, categories, ...rest } = campaign;
    return {
      ...rest,
      products: (products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sellingPrice: product.sellingPrice,
        category: product.category
          ? { id: product.category.id, name: product.category.name }
          : null,
        attachment: product.attachment
          ? { id: product.attachment.id, url: product.attachment.url }
          : null,
      })),
      categories: (categories ?? []).map((category) => ({
        id: category.id,
        name: category.name,
      })),
    };
  }

  private validateDateRange(from?: string, until?: string): void {
    if (from && until && new Date(until) < new Date(from)) {
      throw new BadRequestException('validUntil must be after validFrom');
    }
  }

  /** Assign M2M relations as id refs — repository.save() syncs the junction
   * tables (replaces the previous rows). undefined = leave untouched. */
  private assignRelations(
    campaign: BogoCampaign,
    productIds?: number[],
    categoryIds?: number[],
  ): void {
    if (productIds !== undefined) {
      campaign.products = productIds.map((id) => ({ id }) as Product);
    }
    if (categoryIds !== undefined) {
      campaign.categories = categoryIds.map((id) => ({ id }) as Category);
    }
  }

  // ----- Evaluation -----

  /**
   * Active campaigns (isActive + within date range + under maxUsage),
   * ordered by id — the lowest id claims eligible units first when
   * campaigns overlap. Results are cached in process for 30s (5min stale
   * window): campaign start/end and usage exhaustion lag the storefront by at
   * most that long. Order-time pricing always re-resolves, so no money is lost
   * to staleness.
   */
  async getActiveCampaigns(): Promise<BogoCampaign[]> {
    const now = Date.now();
    // Only the DB-filtered rows are cached; the date window is applied after
    // every read so a campaign starting or ending is honoured immediately.
    const campaigns = await this.activeCache.get('active', () =>
      this.campaignRepository
        .createQueryBuilder('campaign')
        .leftJoinAndSelect('campaign.products', 'product')
        .leftJoinAndSelect('campaign.categories', 'category')
        .where('campaign.isActive = :isActive', { isActive: true })
        .andWhere(
          '(campaign.maxUsage = 0 OR campaign.timesUsed < campaign.maxUsage)',
        )
        .orderBy('campaign.id', 'ASC')
        .getMany(),
    );

    return campaigns.filter(
      (campaign) =>
        (!campaign.validFrom || now >= new Date(campaign.validFrom).getTime()) &&
        (!campaign.validUntil ||
          now <= new Date(campaign.validUntil).getTime()),
    );
  }

  /** Trim nested product/category entities to the fields the storefront
   * needs — full entities expose supplier/admin data (incl. password hashes). */
  toActiveSummaries(campaigns: BogoCampaign[]): ActiveBogoCampaignSummary[] {
    return campaigns.map((campaign) => {
      const { products, categories, ...rest } = campaign;
      return {
        ...rest,
        products: (products ?? []).map(({ id, name, slug }) => ({
          id,
          name,
          slug,
        })),
        categories: (categories ?? []).map(({ id, name, slug }) => ({
          id,
          name,
          slug,
        })),
      };
    });
  }

  /** First active campaign covering the product (directly or via category). */
  resolveForProductFromList(
    campaigns: BogoCampaign[],
    productId: number,
    categoryId?: number,
  ): BogoCampaign | null {
    for (const campaign of campaigns) {
      if (campaign.products?.some((product) => product.id === productId)) {
        return campaign;
      }
      if (
        categoryId !== undefined &&
        campaign.categories?.some((category) => category.id === categoryId)
      ) {
        return campaign;
      }
    }
    return null;
  }

  /**
   * Attach `bogo` to each product (display-only plain prop, never
   * persisted). Whole-catalog campaigns (no products/categories) cover
   * every product; scoped campaigns only their own scope.
   */
  attachBogoInfo<T extends Product | Product[]>(
    products: T,
    campaigns: BogoCampaign[],
  ): T {
    const list = Array.isArray(products) ? products : [products];
    for (const product of list) {
      const campaign = this.resolveForProductFromList(
        campaigns,
        product.id,
        product.category?.id,
      );
      product.bogo = campaign
        ? {
            campaignId: campaign.id,
            name: campaign.name,
            buyQuantity: campaign.buyQuantity,
            getQuantity: campaign.getQuantity,
            // Caps surface to the cart so it can block quantity changes
            // past the deal's per-order ceiling (0 = unlimited)
            maxGroupsPerOrder: campaign.maxGroupsPerOrder ?? 0,
            maxFreePerUser: campaign.maxFreePerUser ?? 0,
            endsAt: campaign.validUntil
              ? new Date(campaign.validUntil).toISOString()
              : null,
          }
        : null;
    }
    return products;
  }

  /**
   * Estimate the BOGO discount for a cart. Unit prices mirror order.service
   * per-item pricing: flash sale first (no stacking), else the product's own
   * discount window. Display-only — order creation is authoritative.
   */
  async preview(
    items: { productId: number; quantity: number }[],
    userId?: number,
  ): Promise<{
    eligible: boolean;
    totalDiscount: number;
    usages: {
      campaign: ActiveBogoCampaignSummary;
      discount: number;
      freeUnits: number;
      groupsPotential: number;
      groupsEarned: number;
      capLimit: 'per_order' | 'per_user' | null;
      freeLines: {
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
      }[];
    }[];
  }> {
    const details: BogoPricingDetail[] = [];
    // Resolved once per cart, not per item
    const flashCampaigns =
      await this.flashSaleCampaignsService.getActiveCampaigns();
    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
        relations: ['category'],
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      let price = Number(product.sellingPrice);
      let productDiscount = 0;
      const now = Date.now();

      // Flash sale wins over the product's own discount — never stacked
      const flashCampaign =
        this.flashSaleCampaignsService.resolveForProductFromList(
          flashCampaigns,
          product.id,
          product.category?.id,
        );
      if (flashCampaign) {
        price = computeFlashPrice(Number(product.sellingPrice), flashCampaign);
        productDiscount = Number(product.sellingPrice) - price;
      } else if (product.discountStartDate && product.discountEndDate) {
        const start = new Date(product.discountStartDate).getTime();
        const end = new Date(product.discountEndDate).getTime();
        if (now >= start && now <= end) {
          if (product.discountType === 'fixed') {
            productDiscount = Number(product.discountValue);
          } else if (product.discountType === 'percentage') {
            productDiscount = price * (Number(product.discountValue) / 100);
          }
          price = Math.max(price - productDiscount, 0);
        }
      }

      details.push({
        productId: product.id,
        categoryId: product.category?.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: price,
        unitDiscount: productDiscount,
        totalPrice: Math.round(price * item.quantity * 100) / 100,
      });
    }

    const campaigns = await this.getActiveCampaigns();
    const perUserFreeUsed = userId
      ? await this.bogoUsageLogService.sumFreeUnitsByUser(
          userId,
          campaigns.map((campaign) => campaign.id),
        )
      : undefined;
    const result = applyBogoDiscount(details, campaigns, perUserFreeUsed);

    // Product names for the free lines the cart renders
    const productNames = new Map(
      details.map((detail) => [detail.productId, detail.productName]),
    );

    return {
      eligible: result.totalDiscount > 0,
      totalDiscount: result.totalDiscount,
      usages: result.usages.map((usage) => ({
        campaign: this.toActiveSummary(usage.campaign),
        discount: usage.discount,
        freeUnits: usage.freeUnits,
        groupsPotential: usage.groupsPotential,
        groupsEarned: usage.groupsEarned,
        capLimit: usage.capLimit,
        freeLines: usage.freeLines.map((line) => ({
          productId: line.productId,
          productName: productNames.get(line.productId) ?? 'Unknown product',
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      })),
    };
  }

  /** Single-campaign variant of toActiveSummaries. */
  private toActiveSummary(campaign: BogoCampaign): ActiveBogoCampaignSummary {
    return this.toActiveSummaries([campaign])[0];
  }

  /**
   * Atomically bump usage — the campaign stops being counted once its limit
   * is reached. A return of false means it was exhausted mid-order (the
   * discount was legitimately valid at resolve time; caller logs and moves on).
   */
  async incrementUsage(id: number): Promise<boolean> {
    const result = await this.campaignRepository
      .createQueryBuilder()
      .update(BogoCampaign)
      .set({ timesUsed: () => '"timesUsed" + 1' })
      .where('id = :id AND ("maxUsage" = 0 OR "timesUsed" < "maxUsage")', { id })
      .execute();
    if (!result.affected) {
      this.logger.warn(`BOGO campaign ${id} reached its maxUsage mid-order`);
    }
    return Boolean(result.affected);
  }
}
