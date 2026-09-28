import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { getDhakaNow } from 'src/common/utils/dhaka-time.util';
import { Category } from 'src/category/entities/category.entity';
import { Order } from 'src/order/entities/order.entity';
import { Product } from 'src/product/entities/product.entity';
import { CheckFreeDeliveryDto } from './dto/check-free-delivery.dto';
import { CreateFreeDeliveryCampaignDto } from './dto/create-free-delivery-campaign.dto';
import { UpdateFreeDeliveryCampaignDto } from './dto/update-free-delivery-campaign.dto';
import { FreeDeliveryCampaign } from './entities/free-delivery-campaign.entity';

export interface EvaluateInput {
  payableSubtotal: number;
  totalQuantity: number;
  items: { productId: number; categoryId?: number }[];
  userId?: number;
}

export interface EvaluateResult {
  eligible: boolean;
  campaign: FreeDeliveryCampaign | null;
}

export interface FreeDeliveryCheckResult {
  freeDelivery: boolean;
  /** 'campaign' — matched; 'pending' — matched except min order amount; 'none' */
  source: 'campaign' | 'pending' | 'none';
  campaignName?: string;
  /** Minimum order amount of the pending campaign (source = 'pending') */
  minOrderAmount?: number;
  /** Amount still needed to unlock the pending campaign */
  remaining?: number;
}

@Injectable()
export class FreeDeliveryCampaignsService {
  constructor(
    @InjectRepository(FreeDeliveryCampaign)
    private readonly campaignRepository: Repository<FreeDeliveryCampaign>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // ----- CRUD -----

  async create(
    dto: CreateFreeDeliveryCampaignDto,
  ): Promise<FreeDeliveryCampaign> {
    this.validateDateRange(dto.validFrom, dto.validUntil);
    const { productIds, categoryIds, ...rest } = dto;

    const campaign = this.campaignRepository.create(rest);
    this.assignRelations(campaign, productIds, categoryIds);
    await this.campaignRepository.save(campaign);
    return this.findOne(campaign.id);
  }

  async update(
    id: number,
    dto: UpdateFreeDeliveryCampaignDto,
  ): Promise<FreeDeliveryCampaign> {
    const campaign = await this.findOne(id);
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

  findAll(): Promise<FreeDeliveryCampaign[]> {
    return this.campaignRepository.find({
      relations: ['products', 'categories'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<FreeDeliveryCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['products', 'categories'],
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

  /** Assign M2M relations as id refs — repository.save() syncs the junction
   * tables (replaces the previous rows). undefined = leave untouched. */
  private assignRelations(
    campaign: FreeDeliveryCampaign,
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

  /** Active campaigns (isActive + within date range), first match wins. */
  async getActiveCampaigns(): Promise<FreeDeliveryCampaign[]> {
    const now = Date.now();
    const campaigns = await this.campaignRepository.find({
      where: { isActive: true },
      relations: ['products', 'categories'],
      order: { id: 'ASC' },
    });
    return campaigns.filter(
      (campaign) =>
        (!campaign.validFrom || now >= new Date(campaign.validFrom).getTime()) &&
        (!campaign.validUntil ||
          now <= new Date(campaign.validUntil).getTime()),
    );
  }

  /**
   * Check one campaign against the cart. Returns:
   * - 'match'  — every condition passes, order gets free delivery
   * - 'amount' — everything passes except the minimum order amount
   * - 'no'     — one or more other conditions fail
   */
  private async assessCampaign(
    campaign: FreeDeliveryCampaign,
    input: EvaluateInput,
    day: number,
    time: string,
  ): Promise<'match' | 'amount' | 'no'> {
    if (campaign.daysOfWeek?.length && !campaign.daysOfWeek.includes(day)) {
      return 'no';
    }

    if (campaign.startTime && campaign.endTime) {
      const inWindow =
        campaign.startTime <= campaign.endTime
          ? time >= campaign.startTime && time < campaign.endTime
          : time >= campaign.startTime || time < campaign.endTime; // midnight wrap
      if (!inWindow) return 'no';
    }

    if (campaign.products?.length || campaign.categories?.length) {
      const productIds = new Set(campaign.products?.map((p) => p.id));
      const categoryIds = new Set(campaign.categories?.map((c) => c.id));
      const hasEligibleItem = input.items.some(
        (item) =>
          productIds.has(item.productId) ||
          (item.categoryId !== undefined && categoryIds.has(item.categoryId)),
      );
      if (!hasEligibleItem) return 'no';
    }

    if (campaign.minQuantity && input.totalQuantity < campaign.minQuantity) {
      return 'no';
    }

    if (campaign.newCustomersOnly) {
      if (!input.userId) return 'no';
      const previousOrders = await this.orderRepository.count({
        where: { user: { id: input.userId } },
      });
      if (previousOrders > 0) return 'no';
    }

    if (
      Number(campaign.minOrderAmount) > 0 &&
      input.payableSubtotal < Number(campaign.minOrderAmount)
    ) {
      return 'amount';
    }

    return 'match';
  }

  /**
   * Evaluate every active campaign in order and return the first match.
   * A campaign limited to products/categories qualifies the whole order as
   * soon as the order contains at least one eligible item.
   */
  async evaluate(input: EvaluateInput): Promise<EvaluateResult> {
    const campaigns = await this.getActiveCampaigns();
    if (!campaigns.length) {
      return { eligible: false, campaign: null };
    }

    const { day, time } = getDhakaNow();

    for (const campaign of campaigns) {
      if ((await this.assessCampaign(campaign, input, day, time)) === 'match') {
        return { eligible: true, campaign };
      }
    }

    return { eligible: false, campaign: null };
  }

  /**
   * Public check used by the cart/checkout banner: evaluates the cart
   * against all active campaigns.
   */
  async check(
    dto: CheckFreeDeliveryDto,
    userId?: number,
  ): Promise<FreeDeliveryCheckResult> {
    const items = dto.items ?? [];
    const productIds = items.map((item) => item.productId);
    const products = productIds.length
      ? await this.productRepository.find({
          where: { id: In(productIds) },
          relations: ['category'],
        })
      : [];
    const categoryByProduct = new Map<number, number | undefined>(
      products.map((product) => [product.id, product.category?.id]),
    );

    const evaluation = await this.evaluate({
      payableSubtotal: dto.payableSubtotal,
      totalQuantity: dto.totalQuantity,
      items: items.map((item) => ({
        productId: item.productId,
        categoryId: categoryByProduct.get(item.productId),
      })),
      userId,
    });

    if (evaluation.eligible && evaluation.campaign) {
      return {
        freeDelivery: true,
        source: 'campaign',
        campaignName: evaluation.campaign.name,
      };
    }

    // Not eligible — if a campaign failed only on the minimum order amount,
    // report it so the storefront can show "add ৳X more" progress.
    const campaigns = await this.getActiveCampaigns();
    if (campaigns.length) {
      const { day, time } = getDhakaNow();
      for (const campaign of campaigns) {
        if (
          (await this.assessCampaign(campaign, {
            payableSubtotal: dto.payableSubtotal,
            totalQuantity: dto.totalQuantity,
            items: items.map((item) => ({
              productId: item.productId,
              categoryId: categoryByProduct.get(item.productId),
            })),
            userId,
          }, day, time)) === 'amount'
        ) {
          const minOrderAmount = Number(campaign.minOrderAmount);
          return {
            freeDelivery: false,
            source: 'pending',
            campaignName: campaign.name,
            minOrderAmount,
            remaining: Math.max(minOrderAmount - dto.payableSubtotal, 0),
          };
        }
      }
    }

    return { freeDelivery: false, source: 'none' };
  }

  async incrementUsage(id: number): Promise<void> {
    await this.campaignRepository.update(id, {
      usageCount: () => 'usage_count + 1',
    });
  }
}
