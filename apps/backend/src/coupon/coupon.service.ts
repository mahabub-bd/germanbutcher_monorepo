import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async createCoupon(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const existingCoupon = await this.couponRepository.findOne({
      where: { code: createCouponDto.code },
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon with this code already exists');
    }

    const { excludedItemIds, ...couponData } = createCouponDto;

    // First save the coupon without relations
    const coupon = this.couponRepository.create(couponData);
    const saved = await this.couponRepository.save(coupon);

    // Then handle excluded items using relation builder
    if (excludedItemIds && excludedItemIds.length > 0) {
      const excludedProducts = await this.productRepository.findBy({
        id: In(excludedItemIds),
      });

      await this.couponRepository
        .createQueryBuilder()
        .relation(Coupon, 'excludedItems')
        .of(saved)
        .add(excludedProducts);
    }

    return this.getCouponWithRelations(saved.id);
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return this.couponRepository.find({ relations: ['excludedItems'] });
  }

  async getCouponByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code },
      relations: ['excludedItems'],
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  private async getCouponWithRelations(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['excludedItems'],
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async updateCoupon(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<Coupon> {
    const { excludedItemIds, ...updateData } = updateCouponDto;

    // Update coupon basic fields
    await this.couponRepository.update(id, updateData);

    // Handle excluded items update
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (excludedItemIds !== undefined) {
      // Get current excluded items
      const currentCoupon = await this.getCouponWithRelations(id);
      const currentExcluded = currentCoupon.excludedItems || [];

      // Remove all existing excluded items
      if (currentExcluded.length > 0) {
        await this.couponRepository
          .createQueryBuilder()
          .relation(Coupon, 'excludedItems')
          .of(coupon)
          .remove(currentExcluded);
      }

      // Add new excluded items
      if (excludedItemIds.length > 0) {
        const excludedProducts = await this.productRepository.findBy({
          id: In(excludedItemIds),
        });

        await this.couponRepository
          .createQueryBuilder()
          .relation(Coupon, 'excludedItems')
          .of(coupon)
          .add(excludedProducts);
      }
    }

    return this.getCouponWithRelations(id);
  }

  async deleteCoupon(id: string): Promise<void> {
    await this.couponRepository.delete(id);
  }

  async validateCoupon(
    code: string,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const coupon = await this.getCouponByCode(code);

      if (!coupon.isActive) {
        throw new BadRequestException('Coupon is not active');
      }

      const now = new Date();

      // Check if coupon has expired
      if (now > coupon.validUntil) {
        throw new HttpException(
          'Coupon has expired',
          HttpStatus.GONE, // 410 Gone - more appropriate for expired resources
        );
      }

      // Check if coupon is not yet valid
      if (now < coupon.validFrom) {
        throw new BadRequestException('Coupon is not yet valid');
      }

      // Check usage limits
      if (coupon.maxUsage !== null && coupon.timesUsed >= coupon.maxUsage) {
        throw new BadRequestException('Coupon usage limit exceeded');
      }

      return { valid: true, message: 'Coupon is valid' };
    } catch (error) {
      // Re-throw HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle any other unexpected errors
      throw new HttpException(
        'Failed to validate coupon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async applyCoupon(
    code: string,
    totalAmount: number,
    cartProductIds?: number[],
    cartItems?: { productId: number; price: number }[],
  ): Promise<{
    discountedAmount: number;
    discountValue: number;
    couponId: string;
    eligibleAmount: number;
    excludedProducts?: { id: number; name: string }[];
  }> {
    try {
      const coupon = await this.getCouponByCode(code);

      await this.validateCoupon(code);

      // Check if any products in cart are excluded from this coupon
      let eligibleAmount = totalAmount;
      let excludedProductsList: { id: number; name: string }[] = [];

      if (coupon.excludedItems && coupon.excludedItems.length > 0) {
        const excludedProductIds = coupon.excludedItems.map((p) => p.id);

        // Calculate eligible amount based on cart items with prices
        if (cartItems && cartItems.length > 0) {
          eligibleAmount = 0;
          for (const item of cartItems) {
            const isExcluded = excludedProductIds.includes(item.productId);
            if (!isExcluded) {
              eligibleAmount += item.price;
            }
          }
        } else if (cartProductIds) {
          // Fallback: if only product IDs are provided, use totalAmount
          // This won't be accurate but maintains backward compatibility
          const excludedInCart = cartProductIds.filter((id) =>
            excludedProductIds.includes(id),
          );

          if (excludedInCart.length > 0) {
            // Fetch excluded product names for response
            const excludedProducts = await this.productRepository.findBy({
              id: In(excludedInCart),
            });
            excludedProductsList = excludedProducts.map((p) => ({
              id: p.id,
              name: p.name,
            }));
          }
        }

        // If we have cart items, get excluded product info
        if (cartItems && coupon.excludedItems.length > 0) {
          const cartProductIdsFromItems = cartItems.map((item) => item.productId);
          const excludedInCart = cartProductIdsFromItems.filter((id) =>
            excludedProductIds.includes(id),
          );

          if (excludedInCart.length > 0) {
            const excludedProducts = await this.productRepository.findBy({
              id: In(excludedInCart),
            });
            excludedProductsList = excludedProducts.map((p) => ({
              id: p.id,
              name: p.name,
            }));
          }
        }
      }

      // Check minimum order amount against eligible amount (not total cart amount)
      if (
        coupon.minOrderAmount !== null &&
        coupon.minOrderAmount !== undefined &&
        eligibleAmount < coupon.minOrderAmount
      ) {
        throw new BadRequestException(
          `Minimum eligible order amount is ${coupon.minOrderAmount}. Your eligible: ${eligibleAmount.toFixed(0)}`,
        );
      }

      let discountValue = 0;

      if (coupon.discountType === 'percentage') {
        discountValue = eligibleAmount * (coupon.value / 100);

        // Apply max discount cap for percentage discounts
        if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
          const maxDiscount = Number(coupon.maxDiscountAmount);
          if (discountValue > maxDiscount) {
            discountValue = maxDiscount;
          }
        }
      } else {
        // For fixed discounts, also apply max discount cap if set
        discountValue = Number(coupon.value);
        if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
          const maxDiscount = Number(coupon.maxDiscountAmount);
          if (discountValue > maxDiscount) {
            discountValue = maxDiscount;
          }
        }
      }

      const discountedAmount = Math.max(eligibleAmount - discountValue, 0);

      return {
        discountedAmount,
        discountValue,
        couponId: coupon.id,
        eligibleAmount,
        excludedProducts: excludedProductsList.length > 0 ? excludedProductsList : undefined,
      };
    } catch (error) {
      // Re-throw HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle any other unexpected errors
      throw new HttpException(
        'Failed to apply coupon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate coupon for specific cart items
   * Returns detailed validation result with excluded product info if any
   * Coupon is still valid even with excluded products - discount just won't apply to them
   */
  async validateCouponForCart(
    code: string,
    cartProductIds: number[],
  ): Promise<{
    valid: boolean;
    message: string;
    excludedProducts?: { id: number; name: string }[];
    warning?: string;
  }> {
    try {
      const coupon = await this.getCouponByCode(code);

      if (!coupon.isActive) {
        return { valid: false, message: 'Coupon is not active' };
      }

      const now = new Date();

      // Check if coupon has expired
      if (now > coupon.validUntil) {
        return { valid: false, message: 'Coupon has expired' };
      }

      // Check if coupon is not yet valid
      if (now < coupon.validFrom) {
        return { valid: false, message: 'Coupon is not yet valid' };
      }

      // Check usage limits
      if (coupon.maxUsage !== null && coupon.timesUsed >= coupon.maxUsage) {
        return { valid: false, message: 'Coupon usage limit exceeded' };
      }

      // Check if any products in cart are excluded from this coupon
      let excludedProductsList: { id: number; name: string }[] = [];
      if (coupon.excludedItems && coupon.excludedItems.length > 0) {
        const excludedProductIds = coupon.excludedItems.map((p) => p.id);

        // Find which cart products are excluded
        const excludedInCart = cartProductIds.filter((id) =>
          excludedProductIds.includes(id),
        );

        if (excludedInCart.length > 0) {
          // Fetch excluded product names
          const excludedProducts = await this.productRepository.findBy({
            id: In(excludedInCart),
          });
          excludedProductsList = excludedProducts.map((p) => ({
            id: p.id,
            name: p.name,
          }));
        }
      }

      // Coupon is valid, but may have excluded products
      const response: {
        valid: boolean;
        message: string;
        excludedProducts?: { id: number; name: string }[];
        warning?: string;
      } = {
        valid: true,
        message: 'Coupon is valid',
      };

      if (excludedProductsList.length > 0) {
        response.excludedProducts = excludedProductsList;
        response.warning = `Discount will not apply to: ${excludedProductsList.map((p) => p.name).join(', ')}`;
      }

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { valid: false, message: 'Coupon not found' };
      }
      return { valid: false, message: 'Failed to validate coupon' };
    }
  }
}
