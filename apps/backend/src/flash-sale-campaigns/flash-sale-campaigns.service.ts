import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from 'src/category/entities/category.entity';
import { DiscountType } from 'src/common/enums/index';
import { Product } from 'src/product/entities/product.entity';
import { CreateFlashSaleCampaignDto } from './dto/create-flash-sale-campaign.dto';
import { UpdateFlashSaleCampaignDto } from './dto/update-flash-sale-campaign.dto';
import { FlashSaleCampaign } from './entities/flash-sale-campaign.entity';

/** Flash info attached to product responses (display-only, never persisted). */
export interface FlashSaleInfo {
  campaignId: number;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  endsAt: string | null;
}

/** Minimal product info exposed on the public /active endpoint. */
export interface CampaignProductSummary {
  id: number;
  name: string;
  slug: string;
}

/** Minimal category info exposed on the public /active endpoint. */
export interface CampaignCategorySummary {
  id: number;
  name: string;
  slug: string;
}

/** Campaign as returned by the public /active endpoint (no full product/
 * category entities — those leak admin data like user password hashes). */
export type ActiveCampaignSummary = Omit<
  FlashSaleCampaign,
  'products' | 'categories'
> & {
  products: CampaignProductSummary[];
  categories: CampaignCategorySummary[];
};

/** Compute the flash price for a selling price under a campaign. Pure. */
export function computeFlashPrice(
  sellingPrice: number,
  campaign: Pick<FlashSaleCampaign, 'discountType' | 'discountValue'>,
): number {
  const value = Number(campaign.discountValue);
  const price =
    campaign.discountType === DiscountType.PERCENTAGE
      ? sellingPrice * (1 - value / 100)
      : sellingPrice - value;
  return Math.max(price, 0);
}

@Injectable()
export class FlashSaleCampaignsService {
  private readonly logger = new Logger(FlashSaleCampaignsService.name);

  constructor(
    @InjectRepository(FlashSaleCampaign)
    private readonly campaignRepository: Repository<FlashSaleCampaign>,
  ) {}

  // ----- CRUD -----

  async create(
    dto: CreateFlashSaleCampaignDto,
  ): Promise<FlashSaleCampaign> {
    this.validateDateRange(dto.validFrom, dto.validUntil);
    this.validateDiscountValue(dto.discountType, dto.discountValue);
    const { productIds, categoryIds, ...rest } = dto;

    const campaign = this.campaignRepository.create(rest);
    this.assignRelations(campaign, productIds, categoryIds);
    await this.campaignRepository.save(campaign);
    return this.findOne(campaign.id);
  }

  async update(
    id: number,
    dto: UpdateFlashSaleCampaignDto,
  ): Promise<FlashSaleCampaign> {
    const campaign = await this.findOne(id);
    const { validFrom, validUntil, productIds, categoryIds, ...rest } = dto;

    this.validateDateRange(
      validFrom ?? campaign.validFrom?.toISOString(),
      validUntil ?? campaign.validUntil?.toISOString(),
    );
    this.validateDiscountValue(
      dto.discountType ?? campaign.discountType,
      dto.discountValue ?? Number(campaign.discountValue),
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

  findAll(): Promise<FlashSaleCampaign[]> {
    return this.campaignRepository.find({
      relations: ['products', 'products.attachment', 'categories'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<FlashSaleCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['products', 'products.attachment', 'categories'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async remove(id: number): Promise<void> {
    const campaign = await this.findOne(id);
    await this.campaignRepository.remove(campaign);
  }

  private validateDateRange(from?: string, until?: string): void {
    if (from && until && new Date(until) < new Date(from)) {
      throw new BadRequestException('validUntil must be after validFrom');
    }
  }

  private validateDiscountValue(
    discountType: DiscountType,
    discountValue: number,
  ): void {
    if (
      discountType === DiscountType.PERCENTAGE &&
      Number(discountValue) > 100
    ) {
      throw new BadRequestException(
        'Percentage discount cannot be greater than 100',
      );
    }
  }

  /** Assign M2M relations as id refs — repository.save() syncs the junction
   * tables (replaces the previous rows). undefined = leave untouched. */
  private assignRelations(
    campaign: FlashSaleCampaign,
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
   * ordered by id — the lowest id wins when campaigns overlap.
   * Results are cached 30s: campaign start/end and usage exhaustion lag the
   * storefront by at most that long. Order-time pricing always re-resolves,
   * so no money is lost to staleness.
   */
  async getActiveCampaigns(): Promise<FlashSaleCampaign[]> {
    const now = Date.now();
    const campaigns = await this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.products', 'product')
      .leftJoinAndSelect('campaign.categories', 'category')
      .where('campaign.isActive = :isActive', { isActive: true })
      .andWhere('(campaign.maxUsage = 0 OR campaign.timesUsed < campaign.maxUsage)')
      .orderBy('campaign.id', 'ASC')
      .cache('active_flash_sale_campaigns', 30_000)
      .getMany();

    return campaigns.filter(
      (campaign) =>
        (!campaign.validFrom || now >= new Date(campaign.validFrom).getTime()) &&
        (!campaign.validUntil ||
          now <= new Date(campaign.validUntil).getTime()),
    );
  }

  /** First active campaign covering the product (directly or via category). */
  resolveForProductFromList(
    campaigns: FlashSaleCampaign[],
    productId: number,
    categoryId?: number,
  ): FlashSaleCampaign | null {
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

  async resolveForProduct(
    productId: number,
    categoryId?: number,
  ): Promise<FlashSaleCampaign | null> {
    const campaigns = await this.getActiveCampaigns();
    return this.resolveForProductFromList(campaigns, productId, categoryId);
  }

  /** Trim nested product/category entities to the fields the storefront
   * needs — full entities expose supplier/admin data (incl. password hashes). */
  toActiveSummaries(
    campaigns: FlashSaleCampaign[],
  ): ActiveCampaignSummary[] {
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
   * Attach `flashSale` + `effectivePrice` to each product (display-only
   * plain props, never persisted). Precedence: flash sale > product's own
   * discount > selling price — matching order.service pricing.
   */
  attachFlashInfo<T extends Product | Product[]>(
    products: T,
    campaigns: FlashSaleCampaign[],
  ): T {
    const list = Array.isArray(products) ? products : [products];
    for (const product of list) {
      const campaign = this.resolveForProductFromList(
        campaigns,
        product.id,
        product.category?.id,
      );
      if (campaign) {
        product.flashSale = {
          campaignId: campaign.id,
          name: campaign.name,
          discountType: campaign.discountType,
          discountValue: Number(campaign.discountValue),
          endsAt: campaign.validUntil
            ? new Date(campaign.validUntil).toISOString()
            : null,
        };
        product.effectivePrice = Number(
          computeFlashPrice(Number(product.sellingPrice), campaign).toFixed(2),
        );
      } else {
        product.flashSale = null;
        product.effectivePrice = Number(Number(product.salePrice).toFixed(2));
      }
    }
    return products;
  }

  /**
   * Atomically bump usage — the campaign stops being counted once its limit
   * is reached. A return of false means it was exhausted mid-order (the
   * price was legitimately valid at resolve time; caller logs and moves on).
   */
  async incrementUsage(id: number): Promise<boolean> {
    const result = await this.campaignRepository
      .createQueryBuilder()
      .update(FlashSaleCampaign)
      .set({ timesUsed: () => '"timesUsed" + 1' })
      .where('id = :id AND ("maxUsage" = 0 OR "timesUsed" < "maxUsage")', { id })
      .execute();
    if (!result.affected) {
      this.logger.warn(
        `Flash sale campaign ${id} reached its maxUsage mid-order`,
      );
    }
    return Boolean(result.affected);
  }
}
