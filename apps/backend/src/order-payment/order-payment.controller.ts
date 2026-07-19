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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/types';
import { User } from '../user/entities/user.entity';
import { DateRangePreset, OrderStatus } from '../common/enums';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { OrderPayment } from './entities/order-payment.entity';
import { OrderPaymentService } from './order-payment.service';

@ApiTags('Order Payments')
@ApiBearerAuth('token')
@Controller('orders/payments')
export class OrderPaymentController {
  constructor(private readonly paymentService: OrderPaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create payment for order' })
  async create(
    @Body() createDto: CreateOrderPaymentDto,
    @Req() req: { user: User },
  ): Promise<ApiResponseDto<OrderPayment>> {
    const data = await this.paymentService.create(createDto, req.user);
    return {
      message: 'Payment created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Get()
  @ApiOperation({ summary: 'Get all payments for order' })
  @ApiParam({ name: 'orderId', type: Number })
  async findAll(
    @Param('orderId') orderId: number,
  ): Promise<ApiResponseDto<OrderPayment[]>> {
    const data = await this.paymentService.findAllForOrder(orderId);
    return {
      message: 'Payments retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all payments across all orders (optional date filter)',
    description:
      'Supports custom date range or presets (today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year). Can filter by order status.',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    example: '2025-11-01',
    description: 'Start date (inclusive) - use with toDate for custom range',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    example: '2025-11-10',
    description: 'End date (inclusive) - use with fromDate for custom range',
  })
  @ApiQuery({
    name: 'preset',
    required: false,
    enum: DateRangePreset,
    description: 'Date range preset - use instead of fromDate/toDate',
  })
  @ApiQuery({
    name: 'orderStatus',
    required: false,
    enum: OrderStatus,
    description: 'Filter by order status',
  })
  async findAllPayments(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('preset') preset?: DateRangePreset,
    @Query('orderStatus') orderStatus?: OrderStatus,
  ): Promise<ApiResponseDto<OrderPayment[]>> {
    const data = await this.paymentService.findAll(
      fromDate,
      toDate,
      preset,
      orderStatus,
    );
    return {
      message: 'Payments retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get single payment' })
  @ApiParam({ name: 'orderId', type: Number })
  @ApiParam({ name: 'paymentId', type: Number })
  @ApiResponse({ status: 200, type: OrderPayment })
  async findOne(
    @Param('paymentId') paymentId: number,
  ): Promise<ApiResponseDto<OrderPayment>> {
    const data = await this.paymentService.findOne(paymentId);
    return {
      message: 'Payment retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Patch(':paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update payment' })
  @ApiParam({ name: 'orderId', type: Number })
  @ApiParam({ name: 'paymentId', type: Number })
  async update(
    @Param('paymentId') paymentId: number,
    @Body() updateDto: UpdateOrderPaymentDto,
    @Req() req: { user: User },
  ): Promise<ApiResponseDto<OrderPayment>> {
    const data = await this.paymentService.update(
      paymentId,
      updateDto,
      req.user,
    );
    return {
      message: 'Payment updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Delete(':paymentId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Delete payment' })
  @ApiParam({ name: 'orderId', type: Number })
  @ApiParam({ name: 'paymentId', type: Number })
  async remove(
    @Param('paymentId') paymentId: number,
  ): Promise<ApiResponseDto<null>> {
    await this.paymentService.remove(paymentId);
    return {
      message: 'Payment deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
