import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';
import {
  computeFlashPrice,
  FlashSaleCampaignsService,
} from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
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
  quantity: number;
  unitPrice: number;
  unitDiscount: number;
  totalPrice: number;
}

/** One campaign's effect on a single order. */
export interface BogoUsage {
  campaign: BogoCampaign;
  discount: number;
  freeUnits: number;
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
 */
export function applyBogoDiscount(
  itemPricingDetails: BogoPricingDetail[],
  campaigns: BogoCampaign[],
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
    const freeUnits = Math.floor(totalUnits / groupSize) * campaign.getQuantity;
    if (freeUnits <= 0) continue;

    let discount = 0;
    let left = freeUnits;
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
    }

    usages.push({ campaign, discount, freeUnits });
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

  constructor(
    @InjectRepository(BogoCampaign)
    private readonly campaignRepository: Repository<BogoCampaign>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly flashSaleCampaignsService: FlashSaleCampaignsService,
  ) {}

  // ----- CRUD -----

  async create(dto: CreateBogoCampaignDto): Promise<AdminBogoCampaignSummary> {
    this.validateDateRange(dto.validFrom, dto.validUntil);
    const { productIds, categoryIds, ...rest } = dto;

    const campaign = this.campaignRepository.create(rest);
    this.assignRelations(campaign, productIds, categoryIds);
    await this.campaignRepository.save(campaign);
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
   * campaigns overlap. Results are cached 30s: campaign start/end and
   * usage exhaustion lag the storefront by at most that long. Order-time
   * pricing always re-resolves, so no money is lost to staleness.
   */
  async getActiveCampaigns(): Promise<BogoCampaign[]> {
    const now = Date.now();
    const campaigns = await this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.products', 'product')
      .leftJoinAndSelect('campaign.categories', 'category')
      .where('campaign.isActive = :isActive', { isActive: true })
      .andWhere('(campaign.maxUsage = 0 OR campaign.timesUsed < campaign.maxUsage)')
      .orderBy('campaign.id', 'ASC')
      .cache('active_bogo_campaigns', 30_000)
      .getMany();

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

  /**
   * Estimate the BOGO discount for a cart. Unit prices mirror order.service
   * per-item pricing: flash sale first (no stacking), else the product's own
   * discount window. Display-only — order creation is authoritative.
   */
  async preview(
    items: { productId: number; quantity: number }[],
  ): Promise<{
    eligible: boolean;
    totalDiscount: number;
    usages: {
      campaign: ActiveBogoCampaignSummary;
      discount: number;
      freeUnits: number;
    }[];
  }> {
    const details: BogoPricingDetail[] = [];
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
          await this.flashSaleCampaignsService.getActiveCampaigns(),
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
        quantity: item.quantity,
        unitPrice: price,
        unitDiscount: productDiscount,
        totalPrice: Math.round(price * item.quantity * 100) / 100,
      });
    }

    const campaigns = await this.getActiveCampaigns();
    const result = applyBogoDiscount(details, campaigns);

    return {
      eligible: result.totalDiscount > 0,
      totalDiscount: result.totalDiscount,
      usages: result.usages.map((usage) => ({
        campaign: this.toActiveSummary(usage.campaign),
        discount: usage.discount,
        freeUnits: usage.freeUnits,
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
