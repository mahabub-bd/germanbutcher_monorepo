import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Order } from 'src/order/entities/order.entity';
import { OrderItem } from 'src/order/entities/order-item.entity';
import { OrderStatus } from 'src/common/enums';
import { ApiResponseDto } from 'src/common/types';
import { EmailService } from 'src/email/email.service';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { AdminUpdateReviewDto } from './dto/admin-update-review.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { ProductReview } from './entities/product-review.entity';

export interface RatingSummary {
  averageRating: number;
  reviewCount: number;
  breakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface ReviewEligibility {
  canReview: boolean;
  status: 'eligible' | 'already_reviewed' | 'not_verified_buyer';
  review?: ProductReview | null;
}

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  // Resolves the review photo; null attachmentId clears it, undefined keeps it.
  private async resolveAttachment(
    attachmentId?: string | null,
  ): Promise<Attachment | null | undefined> {
    if (attachmentId === undefined) return undefined;
    if (attachmentId === null) return null;

    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
    });
    if (!attachment) {
      throw new BadRequestException(
        `Attachment with ID ${attachmentId} not found`,
      );
    }
    return attachment;
  }

  // Order statuses that qualify a customer as a verified buyer for a product.
  // Any real order counts (including 'pending' — checkout completed); only
  // 'cancelled' is excluded. Not gated on paymentStatus so COD customers are
  // not excluded. Visibility is anyway gated by admin approval.
  private static readonly BUYER_STATUSES = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  private async findQualifyingOrder(
    userId: number,
    productId: number,
  ): Promise<Order | null> {
    return this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoinAndSelect('oi.order', 'o')
      .where('oi.productId = :productId', { productId })
      .andWhere('o.userId = :userId', { userId })
      .andWhere('o.orderStatus IN (:...statuses)', {
        statuses: ProductReviewService.BUYER_STATUSES,
      })
      .getOne()
      .then((orderItem) => orderItem?.order ?? null);
  }

  async checkEligibility(
    userId: number,
    productId: number,
  ): Promise<ApiResponseDto<ReviewEligibility>> {
    const existing = await this.reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
      relations: ['user', 'attachment'],
    });

    if (existing) {
      return {
        message: 'Eligibility retrieved successfully',
        statusCode: 200,
        data: {
          canReview: false,
          status: 'already_reviewed',
          review: existing,
        },
      };
    }

    const order = await this.findQualifyingOrder(userId, productId);

    return {
      message: 'Eligibility retrieved successfully',
      statusCode: 200,
      data: order
        ? { canReview: true, status: 'eligible', review: null }
        : { canReview: false, status: 'not_verified_buyer', review: null },
    };
  }

  async findApprovedByProduct(
    productId: number,
    page: number,
    limit: number,
  ): Promise<ApiResponseDto<ProductReview[]>> {
    const [reviews, total] = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .innerJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('product.attachment', 'productAttachment')
      .leftJoinAndSelect('review.attachment', 'attachment')
      .where('review.product.id = :productId', { productId })
      .andWhere('review.isApproved = :isApproved', { isApproved: true })
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      message: 'Product reviews retrieved successfully',
      statusCode: 200,
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getRatingSummary(
    productId: number,
  ): Promise<ApiResponseDto<RatingSummary>> {
    const [aggregate] = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COALESCE(ROUND(AVG(review.rating)::numeric, 1), 0)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('review.product.id = :productId', { productId })
      .andWhere('review.isApproved = :isApproved', { isApproved: true })
      .getRawMany();

    const breakdownRows = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.product.id = :productId', { productId })
      .andWhere('review.isApproved = :isApproved', { isApproved: true })
      .groupBy('review.rating')
      .getRawMany();

    const breakdown: RatingSummary['breakdown'] = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    for (const row of breakdownRows) {
      breakdown[String(row.rating)] = Number(row.count);
    }

    return {
      message: 'Rating summary retrieved successfully',
      statusCode: 200,
      data: {
        averageRating: Number(aggregate?.average ?? 0),
        reviewCount: Number(aggregate?.count ?? 0),
        breakdown,
      },
    };
  }

  async create(
    productId: number,
    userId: number,
    createProductReviewDto: CreateProductReviewDto,
  ): Promise<ApiResponseDto<ProductReview>> {
    const existing = await this.reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const order = await this.findQualifyingOrder(userId, productId);
    if (!order) {
      throw new ForbiddenException(
        'Only customers who have purchased this product can review it',
      );
    }

    const { attachmentId, ...reviewData } = createProductReviewDto;
    const attachment = await this.resolveAttachment(attachmentId ?? null);

    const review = this.reviewRepository.create({
      ...reviewData,
      product: { id: productId },
      user: { id: userId },
      orderId: order.id,
      attachment: attachment ?? null,
      isApproved: false,
      isRejected: false,
    });

    const saved = await this.reviewRepository.save(review);

    // Fire-and-forget admin alert — never blocks or fails the submission.
    const [customer, product] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.productRepository.findOne({ where: { id: productId } }),
    ]);
    void this.emailService.sendNewReviewAdminEmail({
      customerName: customer?.name ?? `User #${userId}`,
      productName: product?.name ?? `Product #${productId}`,
      rating: saved.rating,
      title: saved.title,
      comment: saved.comment,
    });

    return {
      message: 'Review submitted successfully and is awaiting approval',
      statusCode: 201,
      data: saved,
    };
  }

  async updateOwn(
    id: number,
    userId: number,
    updateProductReviewDto: UpdateProductReviewDto,
  ): Promise<ApiResponseDto<ProductReview>> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // Edited content re-enters moderation.
    const { attachmentId, ...updateData } = updateProductReviewDto;
    const attachment = await this.resolveAttachment(attachmentId);
    // Only apply provided fields — an edit must never wipe the title or photo.
    const changes = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined),
    );
    Object.assign(review, changes);
    if (attachment !== undefined) {
      review.attachment = attachment;
    }
    review.isApproved = false;
    review.isRejected = false;
    const saved = await this.reviewRepository.save(review);

    return {
      message: 'Review updated successfully and is awaiting re-approval',
      statusCode: 200,
      data: saved,
    };
  }

  /**
   * Paginated reviews written by a specific user (the authenticated customer),
   * including pending/rejected ones so they can see moderation state.
   */
  async findForUser(
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<ApiResponseDto<ProductReview[]>> {
    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .innerJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('product.attachment', 'productAttachment')
      .leftJoinAndSelect('review.attachment', 'attachment')
      .where('user.id = :userId', { userId })
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [reviews, total] = await qb.getManyAndCount();

    return {
      message: 'My reviews retrieved successfully',
      statusCode: 200,
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findForAdmin(
    query: FindReviewsQueryDto,
  ): Promise<ApiResponseDto<ProductReview[]>> {
    const { page = 1, limit = 10, status = 'all', search } = query;

    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .innerJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.attachment', 'attachment');

    if (status === 'approved') {
      qb.andWhere('review.isApproved = :isApproved', { isApproved: true });
    } else if (status === 'rejected') {
      qb.andWhere('review.isRejected = :isRejected', { isRejected: true });
    } else if (status === 'pending') {
      qb.andWhere('review.isApproved = :isApproved', { isApproved: false });
      qb.andWhere('review.isRejected = :isRejected', { isRejected: false });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(user.name) LIKE :search OR LOWER(review.comment) LIKE :search OR LOWER(product.name) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Oldest pending reviews first so the moderation queue drains FIFO.
    qb.orderBy('review.createdAt', status === 'pending' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [reviews, total] = await qb.getManyAndCount();

    return {
      message: 'Reviews retrieved successfully',
      statusCode: 200,
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async adminSetStatus(
    id: number,
    adminUpdateReviewDto: AdminUpdateReviewDto,
  ): Promise<ApiResponseDto<ProductReview>> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const { isApproved, isRejected } = adminUpdateReviewDto;
    if (isApproved !== undefined) {
      review.isApproved = isApproved;
      // The two flags are mutually exclusive: approving clears rejection.
      if (isApproved) review.isRejected = false;
    }
    if (isRejected !== undefined) {
      review.isRejected = isRejected;
      // Rejecting clears approval; an explicit isRejected:false does not.
      if (isRejected) review.isApproved = false;
    }

    const saved = await this.reviewRepository.save(review);

    return {
      message: 'Review status updated successfully',
      statusCode: 200,
      data: saved,
    };
  }

  async adminDelete(id: number): Promise<ApiResponseDto<null>> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    await this.reviewRepository.remove(review);

    return {
      message: 'Review deleted successfully',
      statusCode: 200,
      data: null,
    };
  }
}
