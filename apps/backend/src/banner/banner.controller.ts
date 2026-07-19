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
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner, BannerPosition, BannerType } from './entities/banner.entity';

@ApiTags('Banners')
@ApiBearerAuth('token')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new banner' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Banner created successfully',
    type: ApiResponseDto<Banner>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attachment not found',
  })
  async create(
    @Body() createBannerDto: CreateBannerDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Banner>> {
    const data = await this.bannerService.create(
      createBannerDto,
      req.user as User,
    );
    return {
      message: 'Banner created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all banners with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term to filter banners by title or description',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: BannerType,
    description: 'Filter by banner type',
  })
  @ApiQuery({
    name: 'position',
    required: false,
    enum: BannerPosition,
    description: 'Filter by banner position',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banners retrieved successfully',
    type: ApiResponseDto<Banner[]>,
  })
  async findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('type') type?: BannerType,
    @Query('position') position?: BannerPosition,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedResponseDto<Banner>> {
    const { data, total } = await this.bannerService.findAll({
      search,
      isActive,
      type,
      position,
      page,
      limit,
    });

    return {
      message: 'Banners retrieved successfully',
      statusCode: HttpStatus.OK,
      data: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active banners' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active banners retrieved successfully',
    type: ApiResponseDto<Banner[]>,
  })
  @CacheKey('banners_active')
  @CacheTTL(60000) // Cache for 60 seconds
  async findActive(): Promise<ApiResponseDto<Banner[]>> {
    const data = await this.bannerService.findActiveBanners();
    return {
      message: 'Active banners retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner retrieved successfully',
    type: ApiResponseDto<Banner>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<Banner>> {
    const data = await this.bannerService.findOne(+id);
    return {
      message: 'Banner retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a banner' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner updated successfully',
    type: ApiResponseDto<Banner>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner or attachment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Banner>> {
    const data = await this.bannerService.update(
      +id,
      updateBannerDto,
      req.user as User,
    );
    return {
      message: 'Banner updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner deleted successfully',
    type: ApiResponseDto<null>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.bannerService.remove(+id);
    return {
      message: 'Banner deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
