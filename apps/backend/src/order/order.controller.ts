import {
  Body,
  Controller,
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
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { DateRangePreset, OrderStatus, PaymentStatus } from '../common/enums/index';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Order } from './entities/order.entity';
import { FindAllOrdersOptions, OrderService } from './order.service';

@ApiTags('Orders')
@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth('token')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by order number',
    type: String,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort by date',
    enum: ['date_asc', 'date_desc'],
  })
  @ApiQuery({
    name: 'orderStatus',
    required: false,
    description: 'Filter by order status',
    enum: OrderStatus,
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    description: 'Filter by payment status',
    enum: PaymentStatus,
  })
  async getOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('sort') sort?: 'date_asc' | 'date_desc',
    @Query('orderStatus') orderStatus?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
  ): Promise<ApiResponseDto<Order[]>> {
    const options: FindAllOrdersOptions = {
      page,
      limit,
      search,
      sort,
      orderStatus,
      paymentStatus,
    };

    const { data, total } = await this.orderService.getAllOrders(options);

    return {
      message: 'Orders retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 orders per minute
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  async create(
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<ApiResponseDto<Order>> {
    const data = await this.orderService.createOrder(createOrderDto);
    return {
      message: 'Order Created successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by ID' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<Order>> {
    const data = await this.orderService.getOrderById(id);
    return {
      message: 'Order retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all orders by user ID' })
  @ApiParam({ name: 'userId', type: Number })
  async getOrdersByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ApiResponseDto<Order[]>> {
    const data = await this.orderService.getOrdersByUserId(userId);
    return {
      message: 'Orders for the user retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id/order-status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      example: {
        status: 'shipped',
        note: 'Package handed over to courier',
      },
    },
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
    @Body('note') note: string,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Order>> {
    const data = await this.orderService.updateOrderStatus(
      id,
      status,
      req.user as User,
      note,
    );

    return {
      message: 'Order Status Updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/payment-status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { example: { status: 'PAID' } } })
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PaymentStatus,
  ): Promise<ApiResponseDto<Order>> {
    const data = await this.orderService.updatePaymentStatus(id, status);

    return {
      message: 'Order payment Status Updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/date-range')
  @ApiOperation({
    summary: 'Get full order report within a specific date range',
    description:
      'Returns all orders with summary (total orders, total value, discount, and paid amount). Includes only user id and name. Supports custom date range or presets (today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year). Can filter by order status.',
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
  async getOrderReportByDateRange(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('preset') preset?: DateRangePreset,
    @Query('orderStatus') orderStatus?: OrderStatus,
  ): Promise<ApiResponseDto<any>> {
    const data = await this.orderService.getOrderReportByDateRange(
      fromDate,
      toDate,
      preset,
      orderStatus,
    );
    return {
      message: 'Order report retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/statistics')
  @ApiOperation({
    summary: 'Get order statistics by status',
    description:
      'Returns total orders and breakdown by status (pending, processing, shipped, delivered, cancelled) with counts and total values',
  })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
    schema: {
      example: {
        message: 'Order statistics retrieved successfully',
        statusCode: 200,
        data: {
          totalOrders: 100,
          pending: 10,
          processing: 15,
          shipped: 20,
          delivered: 50,
          cancelled: 5,
          pendingValue: 5000.0,
          processingValue: 7500.0,
          shippedValue: 10000.0,
          deliveredValue: 25000.0,
          cancelledValue: 2500.0,
        },
      },
    },
  })
  async getOrderStatistics(): Promise<ApiResponseDto<any>> {
    const data = await this.orderService.getOrderStatistics();

    return {
      message: 'Order statistics retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/monthly')
  @ApiOperation({
    summary: 'Get monthly order statistics',
    description: 'Returns order count and total value grouped by month. Includes all orders, delivered orders, and cancelled orders data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly order statistics retrieved successfully',
    schema: {
      example: {
        message: 'Monthly order statistics retrieved successfully',
        statusCode: 200,
        data: [
          {
            year: 2025,
            month: 'November',
            allOrderCount: 123,
            allOrderValue: 192739.29,
            orderCount: 101,
            totalValue: 165993.59,
            cancelOrderCount: 22,
            cancelValue: 26745.70,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getMonthlyOrderReport(): Promise<
    ApiResponseDto<
      {
        year: number;
        month: string;
        allOrderCount: number;
        allOrderValue: number;
        orderCount: number;
        totalValue: number;
        cancelOrderCount: number;
        cancelValue: number;
      }[]
    >
  > {
    const data = await this.orderService.getMonthlyOrderReport();

    return {
      message: 'Monthly order statistics retrieved successfully',
      statusCode: HttpStatus.OK,
      data: data.monthlyData,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/last-30-days-delivered')
  @ApiOperation({
    summary: 'Get last 30 days delivered orders statistics',
    description:
      'Returns daily order count and total value for delivered orders for each of the last 30 days (including today)',
  })
  @ApiResponse({
    status: 200,
    description: 'Last 30 days delivered orders statistics retrieved successfully',
    schema: {
      example: {
        message: 'Last 30 days delivered orders statistics retrieved successfully',
        statusCode: 200,
        data: [
          { date: '2025-01-05', orderCount: 5, totalValue: 12500.50 },
          { date: '2025-01-06', orderCount: 8, totalValue: 20000.00 },
          { date: '2025-01-07', orderCount: 3, totalValue: 7500.25 },
        ],
      },
    },
  })
  async getLast30DaysDeliveredOrders(): Promise<
    ApiResponseDto<{ date: string; orderCount: number; totalValue: number }[]>
  > {
    const data = await this.orderService.getLast30DaysDeliveredOrders();

    return {
      message: 'Last 30 days delivered orders statistics retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/assign-delivery-man')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign delivery man to order',
    description: 'Assigns a delivery man to a specific order',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery man assigned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Order or delivery man not found',
  })
  async assignDeliveryMan(
    @Param('id') id: string,
    @Body('deliveryManId') deliveryManId: number,
  ): Promise<ApiResponseDto<Order>> {
    const data = await this.orderService.assignDeliveryMan(+id, deliveryManId);

    return {
      message: 'Delivery man assigned successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an order',
    description:
      'Cancels an order and updates payment status accordingly. ' +
      'Paid orders will be marked as REFUNDED. ' +
      'Unpaid orders will be marked as FAILED. ' +
      'Stock will be restored for all items. ' +
      'Only PENDING and PROCESSING orders can be cancelled.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Order ID to cancel',
  })
  @ApiBody({
    type: CancelOrderDto,
    description: 'Cancellation details including reason and optional notes',
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    schema: {
      example: {
        message: 'Order cancelled successfully',
        statusCode: 200,
        data: {
          id: 123,
          orderNo: 'ORD-2025-0001',
          orderStatus: 'cancelled',
          paymentStatus: 'refunded',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel order - invalid status or already cancelled',
    schema: {
      example: {
        message: 'Cannot cancel a delivered order',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelOrderDto: CancelOrderDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Order>> {
    const data = await this.orderService.cancelOrder(
      id,
      cancelOrderDto,
      req.user as User,
    );

    return {
      message: 'Order cancelled successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
