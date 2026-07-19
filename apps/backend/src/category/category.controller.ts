import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth('token')
@Controller('categories')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Create new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({
    description: 'Category created successfully',
    schema: {
      example: {
        message: 'Category created successfully',
        statusCode: 201,
        data: {
          id: 1,
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices category',
          isActive: true,
          parentId: null,
          createdAt: '2023-05-15T10:00:00Z',
          updatedAt: '2023-05-15T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateCategoryDto, @Req() req: Request) {
    const category = await this.service.create(dto, req.user as User);
    return this.formatResponse(
      'Category created successfully',
      HttpStatus.CREATED,
      category,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated categories' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 10)',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter Category by name',
    type: String,
  })
  @ApiQuery({
    name: 'slug',
    required: false,
    description: 'Filter by Category slug',
    type: String,
  })
  @ApiQuery({ name: 'parentId', required: false, example: 1 })
  @ApiQuery({
    name: 'isMainCategory',
    required: false,
    type: Boolean,
    description: 'Filter by main categories',
  })
  @ApiQuery({
    name: 'sort',
    enum: ['name_asc', 'name_desc'],
    required: false,
    example: 'name_asc',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter for products in categories',
    type: Number,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter for products in categories',
    type: Number,
  })
  @ApiOkResponse({
    description: 'categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(CategoryResponseDto) },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @CacheKey('categories_key')
  @CacheTTL(30)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 90,
    @Query('search') search?: string,
    @Query('parentId') parentId?: number,
    @Query('slug') slug?: string,
    @Query('isMainCategory') isMainCategory?: boolean,
    @Query('sort') sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc',
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    const [data, total] = await this.service.findAllWithMergedProducts({
      page,
      limit,
      search,
      slug,
      isMainCategory,
      parentId: parentId ? Number(parentId) : undefined,
      sort,
      minPrice,
      maxPrice,
    });

    return {
      message: 'Categories retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get full category hierarchy' })
  @ApiOkResponse({
    description: 'Category tree retrieved successfully',
    schema: {
      example: {
        message: 'Category tree retrieved successfully',
        statusCode: 200,
        data: [
          {
            id: 1,
            name: 'Electronics',
            children: [
              {
                id: 2,
                name: 'Mobile Phones',
                children: [],
              },
            ],
          },
        ],
        page: 1,
        limit: 40,
        total: 1,
        totalPages: 1,
      },
    },
  })
  async getTree() {
    const data = await this.service.getTree();
    return this.formatResponse(
      'Category tree retrieved successfully',
      HttpStatus.OK,
      data,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Category details retrieved successfully',
    schema: {
      example: {
        message: 'Category retrieved successfully',
        statusCode: 200,
        data: {
          id: 1,
          name: 'Electronics',
          children: [],
          products: [],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Category not found',
    schema: {
      example: {
        message: 'Category with ID 1 not found',
        statusCode: 404,
        error: 'Not Found',
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.findOne(id);
    return this.formatResponse(
      'Category retrieved successfully',
      HttpStatus.OK,
      data,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update category details' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({
    description: 'Category updated successfully',
    schema: {
      example: {
        message: 'Category updated successfully',
        statusCode: 200,
        data: {
          id: 1,
          name: 'Updated Electronics',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    const data = await this.service.update(id, dto, req.user as User);
    return this.formatResponse(
      'Category updated successfully',
      HttpStatus.OK,
      data,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Category deleted successfully',
    schema: {
      example: {
        message: 'Category deleted successfully',
        statusCode: 200,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return this.formatResponse('Category deleted successfully', HttpStatus.OK);
  }

  private formatResponse(
    message: string,
    statusCode: number,
    data?: any,
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
  ) {
    const response: any = {
      message,
      statusCode,
    };

    if (data) response.data = data;
    if (pagination) {
      response.page = pagination.page;
      response.limit = pagination.limit;
      response.total = pagination.total;
      response.totalPages = pagination.totalPages;
    }

    return response;
  }
}
