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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
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
import { User } from 'src/user/entities/user.entity';
import { BrandService } from './brand.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './entities/brand.entity';

@ApiTags('Brands')
@Controller('brands')
@ApiBearerAuth('token')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new brand',
    description: 'Creates a new brand with the provided details',
  })
  @ApiBody({ type: CreateBrandDto })
  @ApiCreatedResponse({
    description: 'Brand created successfully',
    schema: {
      example: {
        message: 'Brand created successfully',
        statusCode: 201,
        data: {
          id: 1,
          name: 'Nike',
          description: 'American multinational corporation',
          logoUrl: 'https://example.com/logos/nike.png',
          isActive: true,
          createdAt: '2023-05-15T10:00:00Z',
          updatedAt: '2023-05-15T10:00:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        message: ['name should not be empty', 'logoUrl must be a URL address'],
        statusCode: 400,
        error: 'Bad Request',
      },
    },
  })
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @Req() req: Request,
  ): Promise<{ message: string; statusCode: number; data: Brand }> {
    const brand = await this.brandService.create(
      createBrandDto,
      req.user as User,
    );
    return {
      message: 'Brand created successfully',
      statusCode: HttpStatus.CREATED,
      data: brand,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all brands',
    description: 'Retrieves paginated brands with optional filters and sorting',
  })
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
    description: 'Search term to filter brands by name',
    type: String,
  })
  @ApiQuery({
    name: 'slug',
    required: false,
    description: 'Filter by brand slug',
    type: String,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter brands by active status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort brands or their products',
    enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc'],
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter for products in brands',
    type: Number,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter for products in brands',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Brands retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(BrandResponseDto) },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('slug') slug?: string,
    @Query('sort') sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc',
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('isActive') isActive?: boolean,
  ): Promise<{
    message: string;
    statusCode: number;
    data: Brand[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [brands, total] = await this.brandService.findAll({
      page,
      limit,
      search,
      slug,
      sort,
      minPrice,
      maxPrice,
      isActive,
    });

    return {
      message: 'Brands retrieved successfully',
      statusCode: HttpStatus.OK,
      data: brands,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get brand by ID',
    description: 'Retrieves detailed information about a specific brand',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Brand retrieved successfully',
    schema: {
      example: {
        message: 'Brand retrieved successfully',
        statusCode: 200,
        data: {
          id: 1,
          name: 'Nike',
          description: 'American multinational corporation',
          logoUrl: 'https://example.com/logos/nike.png',
          isActive: true,
          createdAt: '2023-05-15T10:00:00Z',
          updatedAt: '2023-05-15T10:00:00Z',
          products: [],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Brand not found',
    schema: {
      example: {
        message: 'Brand with ID 1 not found',
        statusCode: 404,
        error: 'Not Found',
      },
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<{ message: string; statusCode: number; data: Brand }> {
    const brand = await this.brandService.findOne(+id);
    return {
      message: 'Brand retrieved successfully',
      statusCode: HttpStatus.OK,
      data: brand,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update brand',
    description: 'Updates brand details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateBrandDto })
  @ApiOkResponse({
    description: 'Brand updated successfully',
    schema: {
      example: {
        message: 'Brand updated successfully',
        statusCode: 200,
        data: {
          id: 1,
          name: 'Nike Inc.',
          description: 'Updated description',
          logoUrl: 'https://example.com/logos/nike.png',
          isActive: true,
          createdAt: '2023-05-15T10:00:00Z',
          updatedAt: '2023-05-16T08:30:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Brand not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @Req() req: Request,
  ): Promise<{ message: string; statusCode: number; data: Brand }> {
    const brand = await this.brandService.update(
      +id,
      updateBrandDto,
      req.user as User,
    );
    return {
      message: 'Brand updated successfully',
      statusCode: HttpStatus.OK,
      data: brand,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete brand',
    description: 'Permanently deletes a brand by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    type: Number,
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Brand deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Brand not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.brandService.remove(+id);
  }
}
