import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSalesPointShopDto } from './dto/create-sales-point-shop.dto';

import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateSalesPointShopDto } from './dto/update-sales-point-shop.dto';
import { SalesPointShop } from './entities/sales-point-shop.entity';
import { SalesPointShopService } from './sales-point-shop.service';
@ApiBearerAuth('token')
@ApiTags('Sales Point Shops')
@Controller('sales-point-shops')
export class SalesPointShopController {
  constructor(private readonly salesPointShopService: SalesPointShopService) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new sales point shop/branch',
    description:
      'Creates a new shop/branch for an existing sales point. The sales point must exist before creating shops.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sales point shop created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or sales point not found',
  })
  create(@Body() createSalesPointShopDto: CreateSalesPointShopDto) {
    return this.salesPointShopService.create(createSalesPointShopDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all sales point shops with pagination and filtering',
    description:
      'Retrieve all shops with optional filtering by sales point, location, and pagination support.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales point shops retrieved successfully',
  })
  @ApiQuery({
    name: 'salesPointId',
    required: false,
    type: Number,
    description: 'Filter by sales point ID',
  })
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
  findAll(
    @Query('salesPointId') salesPointId?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.salesPointShopService.findAll(salesPointId, page, limit);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get comprehensive shop statistics',
    description:
      'Retrieve detailed statistics including counts by division, district, and sales point.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStatistics() {
    return this.salesPointShopService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a sales point shop by ID',
    description: 'Retrieve detailed information about a specific shop.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales point shop found',
    type: SalesPointShop,
  })
  @ApiNotFoundResponse({ description: 'Sales point shop not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Shop ID' })
  @ApiQuery({
    name: 'includeSalesPoint',
    required: false,
    type: Boolean,
    description: 'Include sales point details',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeSalesPoint', new DefaultValuePipe(false), ParseBoolPipe)
    includeSalesPoint: boolean = false,
  ) {
    return this.salesPointShopService.findOne(id, includeSalesPoint);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a sales point shop',
    description: 'Update shop information. Sales point ID cannot be changed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales point shop updated successfully',
    type: SalesPointShop,
  })
  @ApiNotFoundResponse({ description: 'Sales point shop not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Shop ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSalesPointShopDto: UpdateSalesPointShopDto,
  ) {
    return this.salesPointShopService.update(id, updateSalesPointShopDto);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/toggle-status')
  @ApiOperation({
    summary: 'Toggle shop active status',
    description: 'Toggle the active/inactive status of a shop.',
  })
  @ApiResponse({ status: 200, description: 'Shop status toggled successfully' })
  @ApiNotFoundResponse({ description: 'Sales point shop not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Shop ID' })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.salesPointShopService.toggleStatus(id);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a sales point shop',
    description: 'Permanently delete a shop. This action cannot be undone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales point shop deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Sales point shop not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Shop ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesPointShopService.remove(id);
  }
}
