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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { SuppliersService } from './supplier.service';

@ApiTags('Suppliers')
@ApiBearerAuth('token')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}
  @UseGuards(AdminGuard, JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Supplier created successfully',
    type: ApiResponseDto<Supplier>,
  })
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Supplier>> {
    const data = await this.suppliersService.create(
      createSupplierDto,
      req.user as User,
    );
    return {
      message: 'Supplier created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all suppliers with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term (searches in name, email, phone)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction (default: asc)',
    example: 'asc',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchases retrieved successfully',
    type: PaginatedResponseDto<Supplier>,
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
    @Query('isActive') isActive?: boolean,
  ): Promise<PaginatedResponseDto<Supplier>> {
    const [suppliers, total] = await this.suppliersService.findAll({
      page,
      limit,
      search,
      sortOrder,
      isActive,
    });

    return {
      message: 'Suppliers retrieved successfully',
      statusCode: HttpStatus.OK,
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Supplier ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier retrieved successfully',
    type: ApiResponseDto<Supplier>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<Supplier>> {
    const data = await this.suppliersService.findOne(id);
    return {
      message: 'Supplier retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(AdminGuard, JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiParam({ name: 'id', type: Number, description: 'Supplier ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier updated successfully',
    type: ApiResponseDto<Supplier>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Supplier>> {
    const data = await this.suppliersService.update(
      id,
      updateSupplierDto,
      req.user as User,
    );
    return {
      message: 'Supplier updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(AdminGuard, JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiParam({ name: 'id', type: Number, description: 'Supplier ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier deleted successfully',
    type: ApiResponseDto<void>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<void>> {
    await this.suppliersService.remove(id);
    return {
      message: 'Supplier deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
