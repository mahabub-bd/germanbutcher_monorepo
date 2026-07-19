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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { ApiResponseDto } from 'src/common/types';
import { User } from '../user/entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Purchase } from './entities/purchase.entity';
import { PurchasesService } from './purchase.service';

@ApiTags('Purchases')
@ApiBearerAuth('token')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new purchase with multiple products',
    description:
      'Allows purchasing multiple products from a single supplier in one transaction',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Purchase created successfully',
    type: ApiResponseDto<Purchase>,
  })
  async create(
    @Body() createPurchaseDto: CreatePurchaseDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Purchase>> {
    const data = await this.purchasesService.create(
      createPurchaseDto,
      req.user as User,
    );
    return {
      message: 'Purchase created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Get all purchases with pagination and filters',
    description:
      'Supports filtering by product, supplier, status, and date ranges',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: Number,
    description: 'Filter purchases containing specific product ID',
  })
  @ApiQuery({
    name: 'supplierId',
    required: false,
    type: Number,
    description: 'Filter purchases from specific supplier',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term (searches in name, email, phone)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    description: 'Filter by purchase status',
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    enum: ['due', 'partial', 'paid'],
    description: 'Filter by payment status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchases retrieved successfully',
    type: PaginatedResponseDto,
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string,
    @Query('productId') productId?: number,
    @Query('supplierId') supplierId?: number,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: 'due' | 'partial' | 'paid',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.purchasesService.findAll({
      page,
      limit,
      search,
      productId,
      supplierId,
      status,
      paymentStatus,
      startDate,
      endDate,
    });
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get purchase details with items',
    description: 'Returns full purchase details including all purchased items',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Purchase ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase retrieved successfully',
    type: ApiResponseDto<Purchase>,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<Purchase>> {
    const purchase = await this.purchasesService.findOne(id);
    return {
      message: 'Purchase retrieved successfully',
      statusCode: HttpStatus.OK,
      data: purchase,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update purchase details',
    description:
      'Can update items, status, payment information, and other details',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Purchase ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase updated successfully',
    type: Purchase,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Purchase>> {
    const data = await this.purchasesService.update(
      id,
      updatePurchaseDto,
      req.user as User,
    );
    return {
      message: 'Purchase updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('superadmin')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a purchase',
    description:
      'Permanently removes a purchase and adjusts inventory if delivered',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Purchase ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase deleted successfully',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<void>> {
    await this.purchasesService.remove(id);
    return {
      message: 'Purchase deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
