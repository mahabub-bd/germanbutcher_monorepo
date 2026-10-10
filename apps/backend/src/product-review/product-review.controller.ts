import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { AdminUpdateReviewDto } from './dto/admin-update-review.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { ProductReview } from './entities/product-review.entity';
import {
  ProductReviewService,
  RatingSummary,
  ReviewEligibility,
} from './product-review.service';

@ApiTags('Product Reviews')
@Controller('reviews')
export class ProductReviewController {
  constructor(private readonly reviewService: ProductReviewService) {}

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get approved reviews for a product',
    description:
      'Retrieves a paginated list of approved, publicly visible reviews for a product',
  })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Product reviews retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Product reviews retrieved successfully' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductReview' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  findApprovedByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseDto<ProductReview[]>> {
    return this.reviewService.findApprovedByProduct(
      productId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get('product/:productId/rating-summary')
  @ApiOperation({
    summary: 'Get rating summary for a product',
    description:
      'Retrieves the average rating, total review count and per-star breakdown of approved reviews',
  })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Rating summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Rating summary retrieved successfully' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            averageRating: { type: 'number', example: 4.5 },
            reviewCount: { type: 'number', example: 12 },
            breakdown: {
              type: 'object',
              properties: {
                '1': { type: 'number', example: 0 },
                '2': { type: 'number', example: 1 },
                '3': { type: 'number', example: 2 },
                '4': { type: 'number', example: 3 },
                '5': { type: 'number', example: 6 },
              },
            },
          },
        },
      },
    },
  })
  getRatingSummary(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ApiResponseDto<RatingSummary>> {
    return this.reviewService.getRatingSummary(productId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Get('my')
  @ApiOperation({
    summary: 'Get my reviews',
    description:
      "Retrieves the authenticated customer's own reviews, including pending and rejected ones",
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'My reviews retrieved successfully',
  })
  findMyReviews(
    @GetUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseDto<ProductReview[]>> {
    return this.reviewService.findForUser(
      user.userId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Get('eligibility/:productId')
  @ApiOperation({
    summary: 'Check review eligibility',
    description:
      'Checks whether the authenticated customer can review a product (verified buyer, not already reviewed)',
  })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Eligibility retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            canReview: { type: 'boolean', example: true },
            status: {
              type: 'string',
              enum: ['eligible', 'already_reviewed', 'not_verified_buyer'],
              example: 'eligible',
            },
            review: { $ref: '#/components/schemas/ProductReview' },
          },
        },
      },
    },
  })
  checkEligibility(
    @GetUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ApiResponseDto<ReviewEligibility>> {
    return this.reviewService.checkEligibility(user.userId, productId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Post('product/:productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a product review',
    description:
      'Creates a review for a product. Only verified buyers (with a processing, shipped or delivered order containing the product) can submit. The review is pending until an admin approves it.',
  })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiBody({ type: CreateProductReviewDto })
  @ApiResponse({
    status: 201,
    description: 'Review submitted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Review submitted successfully and is awaiting approval' },
        statusCode: { type: 'number', example: 201 },
        data: { $ref: '#/components/schemas/ProductReview' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Customer has not purchased this product',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Customer has already reviewed this product',
  })
  create(
    @GetUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() createProductReviewDto: CreateProductReviewDto,
  ): Promise<ApiResponseDto<ProductReview>> {
    return this.reviewService.create(productId, user.userId, createProductReviewDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Patch(':id')
  @ApiOperation({
    summary: 'Edit own review',
    description:
      'Updates the authenticated customer\'s own review. Edited reviews are reset to pending and must be re-approved.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateProductReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Review updated successfully and is awaiting re-approval' },
        statusCode: { type: 'number', example: 200 },
        data: { $ref: '#/components/schemas/ProductReview' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the review owner' })
  @ApiResponse({ status: 404, description: 'Not Found - Review not found' })
  updateOwn(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductReviewDto: UpdateProductReviewDto,
  ): Promise<ApiResponseDto<ProductReview>> {
    return this.reviewService.updateOwn(id, user.userId, updateProductReviewDto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('token')
  @ModulePermissions('/admin/review/review-list')
  @Get('admin')
  @ApiOperation({
    summary: 'Get reviews for moderation (admin)',
    description:
      'Retrieves a paginated list of reviews with optional status filtering and search',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['all', 'pending', 'approved', 'rejected'],
    example: 'pending',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductReview' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  findForAdmin(
    @Query() query: FindReviewsQueryDto,
  ): Promise<ApiResponseDto<ProductReview[]>> {
    return this.reviewService.findForAdmin(query);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('token')
  @ModulePermissions('/admin/review/review-list')
  @Patch('admin/:id')
  @ApiOperation({
    summary: 'Approve or reject a review (admin)',
    description:
      'Sets moderation flags on a review. Approving clears the rejected flag and vice versa.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: AdminUpdateReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Review status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Review status updated successfully' },
        statusCode: { type: 'number', example: 200 },
        data: { $ref: '#/components/schemas/ProductReview' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Not Found - Review not found' })
  adminSetStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() adminUpdateReviewDto: AdminUpdateReviewDto,
  ): Promise<ApiResponseDto<ProductReview>> {
    return this.reviewService.adminSetStatus(id, adminUpdateReviewDto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('token')
  @ModulePermissions('/admin/review/review-list')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a review (admin)',
    description: 'Permanently removes a review',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Review deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Review deleted successfully' },
        statusCode: { type: 'number', example: 200 },
        data: { type: 'null', example: null },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Not Found - Review not found' })
  adminDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    return this.reviewService.adminDelete(id);
  }
}
