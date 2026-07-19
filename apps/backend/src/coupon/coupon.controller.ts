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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { ApiResponseDto } from 'src/common/types';
import { CouponService } from './coupon.service';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { Coupon } from './entities/coupon.entity';

@ApiTags('Coupons')
@Controller('coupons')
@ApiBearerAuth('token')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Post()
  @ApiOperation({ summary: 'Create new coupon' })
  @ApiOkResponse({
    description: 'Coupon created successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CouponResponseDto) },
          },
        },
      ],
    },
  })
  createCoupon(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.createCoupon(createCouponDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiOkResponse({
    description: 'List of coupons retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CouponResponseDto) },
            },
          },
        },
      ],
    },
  })
  async getAllCoupons(): Promise<ApiResponseDto<Coupon[]>> {
    const data = await this.couponService.getAllCoupons();
    return {
      message: 'Coupons retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Get(':code')
  @ApiOperation({ summary: 'Get coupon by code' })
  @ApiOkResponse({
    description: 'Coupon details retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CouponResponseDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  async getCouponByCode(
    @Param('code') code: string,
  ): Promise<ApiResponseDto<Coupon>> {
    const data = await this.couponService.getCouponByCode(code);
    return {
      message: 'Coupon retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon' })
  @ApiOkResponse({
    description: 'Coupon updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CouponResponseDto) },
          },
        },
      ],
    },
  })
  async updateCoupon(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<ApiResponseDto<Coupon>> {
    const data = await this.couponService.updateCoupon(id, updateCouponDto);
    return {
      message: 'Coupon updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete coupon' })
  @ApiOkResponse({
    description: 'Coupon deleted successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async deleteCoupon(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.couponService.deleteCoupon(id);
    return {
      message: 'Coupon deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon code' })
  @ApiQuery({ name: 'code', example: 'SUMMER20' })
  @ApiOkResponse({
    description: 'Coupon validation result',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean', example: true },
                message: {
                  type: 'string',
                  example: 'Coupon is valid',
                },
              },
            },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  @ApiBadRequestResponse({
    description:
      'Coupon is invalid (inactive, not yet valid, or usage limit exceeded)',
  })
  @ApiGoneResponse({ description: 'Coupon has expired' })
  async validateCoupon(
    @Query('code') code: string,
  ): Promise<ApiResponseDto<{ valid: boolean; message: string }>> {
    try {
      const result = await this.couponService.validateCoupon(code);
      return {
        message: 'Coupon validated successfully',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      // NestJS will automatically handle HTTP exceptions
      throw error;
    }
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply coupon to order' })
  async applyCoupon(
    @Body() applyCouponDto: ApplyCouponDto,
  ): Promise<
    ApiResponseDto<{
      discountedAmount: number;
      discountValue: number;
      couponId: string;
      eligibleAmount: number;
      excludedProducts?: { id: number; name: string }[];
    }>
  > {
    try {
      // Calculate total amount from cart items
      const totalAmount = applyCouponDto.cartItems.reduce(
        (sum, item) => sum + item.price,
        0,
      );

      const data = await this.couponService.applyCoupon(
        applyCouponDto.code,
        totalAmount,
        applyCouponDto.cartItems.map((item) => item.productId),
        applyCouponDto.cartItems,
      );

      let message = 'Coupon applied successfully';
      if (data.excludedProducts && data.excludedProducts.length > 0) {
        const excludedNames = data.excludedProducts.map((p) => p.name).join(', ');
        message = `Coupon applied. Discount not applicable for: ${excludedNames}`;
      }

      return {
        message,
        statusCode: HttpStatus.OK,
        data,
      };
    } catch (error) {
      // NestJS will automatically handle HTTP exceptions
      throw error;
    }
  }

  @Post('validate-cart')
  @ApiOperation({ summary: 'Validate coupon for cart items' })
  @ApiQuery({ name: 'code', example: 'SUMMER20' })
  @ApiQuery({
    name: 'productIds',
    description: 'Comma-separated product IDs in cart',
    example: '1,2,3',
    required: true,
  })
  @ApiOkResponse({
    description: 'Coupon validation result with excluded product info',
  })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  async validateCouponForCart(
    @Query('code') code: string,
    @Query('productIds') productIds: string,
  ): Promise<
    ApiResponseDto<{
      valid: boolean;
      message: string;
      excludedProducts?: { id: number; name: string }[];
      warning?: string;
    }>
  > {
    try {
      const cartProductIds = productIds
        .split(',')
        .map((id) => parseInt(id.trim()));

      const data = await this.couponService.validateCouponForCart(
        code,
        cartProductIds,
      );

      if (!data.valid) {
        return {
          message: data.message,
          statusCode: HttpStatus.BAD_REQUEST,
          data,
        };
      }

      let message = 'Coupon validated successfully';
      if (data.warning) {
        message = data.warning;
      }

      return {
        message,
        statusCode: HttpStatus.OK,
        data,
      };
    } catch (error) {
      // NestJS will automatically handle HTTP exceptions
      throw error;
    }
  }
}
