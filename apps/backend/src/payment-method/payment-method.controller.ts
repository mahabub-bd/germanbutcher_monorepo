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
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentMethodService } from './payment-method.service';

@ApiTags('Payment Methods')
@ApiBearerAuth('token')
@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new payment method',
    description:
      'Creates a new payment method entry in the system. Requires admin privileges.',
  })
  @ApiBody({
    type: CreatePaymentMethodDto,
    description: 'Payment method creation data',
    examples: {
      basic: {
        summary: 'Basic Payment Method',
        value: {
          code: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Direct bank transfer payment',
          isActive: true,
        },
      },
      minimal: {
        summary: 'Minimal Required Fields',
        value: {
          code: 'credit_card',
          name: 'Credit Card',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment method created successfully',
    type: ApiResponseDto<PaymentMethod>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data / Missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized (invalid or missing token)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden (insufficient permissions)',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Payment method with this code already exists',
  })
  async create(
    @Body() createDto: CreatePaymentMethodDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<PaymentMethod>> {
    const data = await this.paymentMethodService.create(
      createDto,
      req.user as User,
    );
    return {
      message: 'Payment method created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'List all payment methods',
    description:
      'Retrieves a paginated list of all payment methods. Can filter by active status.',
  })
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
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
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
    description: 'Payment methods retrieved successfully',
    type: ApiResponseDto<PaymentMethod[]>,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized (invalid or missing token)',
  })
  async findAll(): Promise<ApiResponseDto<PaymentMethod[]>> {
    const data = await this.paymentMethodService.findAll();
    return {
      message: 'Payment methods retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get payment method details',
    description:
      'Retrieves detailed information about a specific payment method.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Payment method ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment method details retrieved successfully',
    type: ApiResponseDto<PaymentMethod>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment method not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized (invalid or missing token)',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<PaymentMethod>> {
    const data = await this.paymentMethodService.findOne(+id);
    return {
      message: 'Payment method retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update payment method',
    description: 'Updates an existing payment method. Partial updates allowed.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Payment method ID',
    example: 1,
  })
  @ApiBody({
    type: UpdatePaymentMethodDto,
    description: 'Payment method update data',
    examples: {
      nameUpdate: {
        summary: 'Update Name',
        value: { name: 'Updated Payment Method Name' },
      },
      statusUpdate: {
        summary: 'Update Status',
        value: { isActive: false },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment method updated successfully',
    type: ApiResponseDto<PaymentMethod>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment method not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized (invalid or missing token)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden (insufficient permissions)',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentMethodDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<PaymentMethod>> {
    const data = await this.paymentMethodService.update(
      +id,
      updateDto,
      req.user as User,
    );
    return {
      message: 'Payment method updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete payment method',
    description: 'Soft-deletes a payment method. Requires admin privileges.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Payment method ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment method deleted successfully',
    type: ApiResponseDto<null>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment method not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized (invalid or missing token)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden (insufficient permissions)',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Payment method is in use and cannot be deleted',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.paymentMethodService.remove(+id);
    return {
      message: 'Payment method deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
