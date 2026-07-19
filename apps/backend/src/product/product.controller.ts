import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SkipAnalytics } from 'src/common/decorators/skip-analytics.decorator';
import { SkipThrottle } from 'src/common/decorators/skip-throttle.decorator';
import { User } from 'src/user/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth('token')
@SkipThrottle()
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Post()
  @ApiOperation({
    summary: 'Create a new product with discount',
    description: 'Creates a new product including discount configuration',
  })
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
  ) {
    const product = await this.productService.create(
      createProductDto,
      req.user as User,
    );
    return this.formatResponse(
      'Product created successfully',
      HttpStatus.CREATED,
      product,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get filtered products',
    description:
      'Retrieve products with advanced filtering and sorting options',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter products by name',
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category ID',

    type: Number,
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    description: 'Filter by brand ID',

    type: Number,
  })
  @ApiQuery({
    name: 'supplier',
    required: false,
    description: 'Filter by supplier ID',

    type: Number,
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    description: 'Filter featured products',

    type: Boolean,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by product name or description',

    type: String,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sorting criteria',
    enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc'],
    example: 'price_desc',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',

    type: Number,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',

    type: Number,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',

    type: Boolean,
  })
  @ApiQuery({
    name: 'hasDiscount',
    required: false,
    description: 'Filter products with any discount',

    type: Boolean,
  })
  @ApiQuery({
    name: 'discountType',
    required: false,
    description: 'Filter by discount type',
    enum: ['percentage', 'fixed'],
  })
  @ApiQuery({
    name: 'discountActive',
    required: false,
    description: 'Filter products with currently active discounts',

    type: Boolean,
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Filter by tags (comma-separated)',

    type: String,
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
    type: [ProductResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') categoryId: number,
    @Query('brand') brandId: number,
    @Query('supplier') supplierId: number,
    @Query('featured') featured: boolean,
    @Query('search') search: string,
    @Query('sort') sort: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc',
    @Query('minPrice') minPrice: number,
    @Query('maxPrice') maxPrice: number,
    @Query('isActive') isActive: boolean,
    @Query('hasDiscount') hasDiscount: boolean,
    @Query('tags') tags: string,
  ) {
    const [products, total] = await this.productService.findAll({
      page,
      limit,
      categoryId,
      brandId,
      supplierId,
      featured,
      search,
      sort,
      minPrice,
      maxPrice,
      isActive,
      hasDiscount,
      tags,
    });

    return this.formatResponse(
      'Products retrieved successfully',
      HttpStatus.OK,
      products,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    );
  }

  @Get('discounted')
  @ApiOperation({
    summary: 'Get active discounted products',
    description: 'Retrieves products with currently active discounts',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    type: Boolean,
  })
  @ApiOkResponse({
    description: 'Discounted products retrieved successfully',
    type: [ProductResponseDto],
  })
  @CacheKey('products_discounted')
  @CacheTTL(60000) // Cache for 1 minute
  async getActiveDiscountedProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: boolean,
  ) {
    const [products, total] = await this.productService.findActiveDiscounted({
      page,
      limit,
      isActive,
    });

    return this.formatResponse(
      'Discounted products retrieved successfully',
      HttpStatus.OK,
      products,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    );
  }
  @Get('bestsellers')
  @ApiOperation({ summary: 'Get the best-selling products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    type: Boolean,
  })
  @CacheKey('products_bestsellers')
  @CacheTTL(60000) // Cache for 1 minute
  async getBestsellingProducts(
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: boolean,
  ) {
    const products = await this.productService.getBestsellingProducts(
      limit,
      isActive,
    );
    return this.formatResponse(
      'Product retrieved successfully',
      HttpStatus.OK,
      products,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products for homepage' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return',
    example: 10,
    type: Number,
  })
  @CacheKey('products_featured')
  @CacheTTL(60000) // Cache for 1 minute
  async getFeaturedProducts(@Query('limit') limit: number = 10) {
    const [products] = await this.productService.findAll({
      page: 1,
      limit,
      featured: true,
      isActive: true,
    });
    return this.formatResponse(
      'Featured products retrieved successfully',
      HttpStatus.OK,
      products,
    );
  } 29

  @Get('tags')
  @ApiOperation({
    summary: 'Get all unique product tags',
    description: 'Returns a list of all unique tags from all products',
  })
  @ApiOkResponse({
    description: 'Tags retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @CacheKey('product_tags')
  @CacheTTL(300000) // Cache for 5 minutes
  async getAllTags() {
    const tags = await this.productService.getAllTags();
    return this.formatResponse(
      'Tags retrieved successfully',
      HttpStatus.OK,
      tags,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/low-stock')
  @ApiOperation({
    summary: 'Get low stock products report',
    description:
      'Returns products with stock below or equal to the specified threshold (default: 10)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Stock threshold (default: 10)',
    example: 10,
    type: Number,
  })
  async getLowStockReport(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('threshold') threshold: number = 10,
  ) {
    const [products, total] = await this.productService.getLowStockReport(
      threshold,
      page,
      limit,
    );
    return this.formatResponse(
      'Low stock products retrieved successfully',
      HttpStatus.OK,
      products,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        threshold,
      } as any,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/out-of-stock')
  @ApiOperation({
    summary: 'Get out of stock products report',
    description: 'Returns all products with zero stock',
  })
  async getOutOfStockReport() {
    const products = await this.productService.getOutOfStockReport();
    return this.formatResponse(
      'Out of stock products retrieved successfully',
      HttpStatus.OK,
      products,
      {
        total: products.length,
      } as any,
    );
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get product details',
    description: 'Retrieves product by slug',
  })
  @ApiOkResponse({ type: ProductResponseDto })
  @SkipAnalytics()
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.productService.findBySlug(slug);
    return this.formatResponse(
      'Product retrieved successfully by slug',
      HttpStatus.OK,
      product,
    );
  }
  @Get(':id')
  @ApiOperation({
    summary: 'Get product details',
    description: 'Retrieves product by ID',
  })
  @ApiOkResponse({ type: ProductResponseDto })
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findOne(+id);
    return this.formatResponse(
      'Product retrieved successfully',
      HttpStatus.OK,
      product,
    );
  }
  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar best-selling products (max 8)' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID to find similar products',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return (default: 8, max: 8)',
    type: Number,
  })
  @ApiQuery({
    name: 'includeChildren',
    required: false,
    description: 'Include products from child categories (default: true)',
    type: Boolean,
  })
  @ApiOkResponse({
    description: 'Similar best-selling products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ProductResponseDto) },
        },
        baseProduct: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            categoryName: { type: 'string' },
          },
        },
      },
    },
  })
  @CacheKey('similar_products_key')
  @CacheTTL(60)
  async getSimilarProducts(
    @Param('id') id: number,
    @Query('limit') limit = 8,
    @Query('includeChildren') includeChildren = true,
  ) {
    // Enforce max limit of 8
    const maxLimit = Math.min(Number(limit), 8);

    const [data, baseProduct] =
      await this.productService.findSimilarBestSelling({
        productId: Number(id),
        limit: maxLimit,
        includeChildren,
      });

    return {
      message: 'Similar best-selling products retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
      baseProduct: {
        id: baseProduct.id,
        name: baseProduct.name,
        categoryName: baseProduct.category?.name,
      },
    };
  }
  @UseGuards(JwtAuthGuard)
  @Roles('superadmin')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update product details',
    description: 'Updates product information including discount configuration',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ type: ProductResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request,
  ) {
    const product = await this.productService.update(
      +id,
      updateProductDto,
      req.user as any,
    );
    return this.formatResponse(
      'Product updated successfully',
      HttpStatus.OK,
      product,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Roles('superadmin')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product',
    description: 'Permanently removes a product',
  })
  @ApiOkResponse({ description: 'Product deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.productService.remove(+id);
    return this.formatResponse(
      'Product deleted successfully',
      HttpStatus.OK,
      null,
    );
  }

  private formatResponse(
    message: string,
    statusCode: number,
    data: any,
    meta?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
  ): any {
    if (meta) {
      return {
        message,
        statusCode,
        data,
        ...meta,
      };
    }
    return {
      message,
      statusCode,
      data,
    };
  }
}
