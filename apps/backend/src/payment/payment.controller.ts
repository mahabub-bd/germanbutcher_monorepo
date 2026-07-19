import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@ApiBearerAuth('token')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new payment',
    description:
      'Records a payment against a purchase and updates the purchase payment status.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment created successfully',
    type: ApiResponseDto<Payment>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Payment>> {
    const data = await this.paymentService.create(
      createPaymentDto,
      req.user as User,
    );
    return {
      message: 'Payment created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  @ApiOperation({
    summary: 'Get all payments',
    description:
      'Retrieves a paginated list of payments with optional filters.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'purchaseId',
    required: false,
    description: 'Filter by purchase ID',
  })
  @ApiQuery({
    name: 'method',
    required: false,
    description: 'Filter by payment method',
    enum: ['cash', 'bank_transfer', 'cheque', 'credit_card', 'other'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully',
    type: ApiResponseDto<Payment[]>,
  })
  async findAll(): Promise<ApiResponseDto<Payment[]>> {
    const data = await this.paymentService.findAll();
    return {
      message: 'Payments retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieves detailed information about a specific payment.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment retrieved successfully',
    type: ApiResponseDto<Payment>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<Payment>> {
    const data = await this.paymentService.findOne(+id);
    return {
      message: 'Payment retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a payment',
    description:
      'Updates payment details and recalculates purchase payment status if amount changed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment updated successfully',
    type: ApiResponseDto<Payment>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Payment>> {
    const data = await this.paymentService.update(
      +id,
      updatePaymentDto,
      req.user as User,
    );
    return {
      message: 'Payment updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a payment',
    description:
      'Deletes a payment record and updates the associated purchase payment status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment method deleted successfully',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment deleted successfully',
    type: ApiResponseDto<null>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.paymentService.remove(+id);
    return {
      message: 'Payment deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
