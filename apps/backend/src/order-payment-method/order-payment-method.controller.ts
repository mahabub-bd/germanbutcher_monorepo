// src/order-payment-method/order-payment-method.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { ApiResponseDto } from 'src/common/types';

import { CreateOrderPaymentMethodDto } from './dto/create-order-payment-method.dto';
import { UpdateOrderPaymentMethodDto } from './dto/update-order-payment-method.dto';
import { OrderPaymentMethod } from './entities/order-payment-method.entity';
import { OrderPaymentMethodService } from './order-payment-method.service';

@Controller('order-payment-methods')
@ApiTags('Order Payment Methods')
@ApiBearerAuth('token')
export class OrderPaymentMethodController {
  constructor(
    private readonly paymentMethodService: OrderPaymentMethodService,
  ) {}

  // ----------------------------------------
  // Create Payment Method
  // ----------------------------------------
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Post()
  @ApiOperation({ summary: 'Create a new payment method' })
  @ApiBody({ type: CreateOrderPaymentMethodDto })
  @ApiResponse({
    status: 201,
    description: 'Payment method created successfully',
    type: OrderPaymentMethod,
  })
  async create(
    @Body() createDto: CreateOrderPaymentMethodDto,
  ): Promise<ApiResponseDto<OrderPaymentMethod>> {
    const data = await this.paymentMethodService.create(createDto);
    return {
      message: 'Payment method created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  // ----------------------------------------
  // Get All Payment Methods
  // ----------------------------------------
  @Get()
  @ApiOperation({ summary: 'Get all payment methods' })
  @ApiResponse({
    status: 200,
    description: 'List of payment methods retrieved successfully',
    type: OrderPaymentMethod,
    isArray: true,
  })
  async findAll(): Promise<ApiResponseDto<OrderPaymentMethod[]>> {
    const data = await this.paymentMethodService.findAll();
    return {
      message: 'Payment methods retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ----------------------------------------
  // Get Payment Method By ID
  // ----------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get a single payment method by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Payment method retrieved successfully',
    type: OrderPaymentMethod,
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<OrderPaymentMethod>> {
    const data = await this.paymentMethodService.findOne(+id);
    return {
      message: 'Payment method retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ----------------------------------------
  // Toggle Active Status
  // ----------------------------------------
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle payment method active status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateOrderPaymentMethodDto })
  @ApiResponse({
    status: 200,
    description: 'Payment method status updated successfully',
    type: OrderPaymentMethod,
  })
  async toggleStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderPaymentMethodDto,
  ): Promise<ApiResponseDto<OrderPaymentMethod>> {
    const data = await this.paymentMethodService.update(+id, updateDto);
    return {
      message: `Payment method ${data.isActive ? 'activated' : 'deactivated'}`,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ----------------------------------------
  // Update Payment Method
  // ----------------------------------------
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing payment method' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateOrderPaymentMethodDto })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated successfully',
    type: OrderPaymentMethod,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderPaymentMethodDto,
  ): Promise<ApiResponseDto<OrderPaymentMethod>> {
    const data = await this.paymentMethodService.update(+id, updateDto);
    return {
      message: 'Payment method updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
