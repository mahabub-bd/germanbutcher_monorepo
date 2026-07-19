import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { ApiResponseDto } from 'src/common/types';
import { CouponUsageLogService } from './coupon-usage-log.service';
import { CouponUsageLog } from './entities/coupon-usage-log.entity';
import { CouponUsageLogResponseDto } from './dto/coupon-usage-log-response.dto';

@ApiTags('Coupon Usage Logs')
@Controller('coupon-usage-logs')
@ApiBearerAuth('token')
export class CouponUsageLogController {
  constructor(private readonly couponUsageLogService: CouponUsageLogService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Get()
  @ApiOperation({ summary: 'Get all coupon usage logs' })
  @ApiOkResponse({
    description: 'Coupon usage logs retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CouponUsageLogResponseDto) },
            },
          },
        },
      ],
    },
  })
  async getAllCouponUsageLogs(): Promise<ApiResponseDto<CouponUsageLog[]>> {
    const data = await this.couponUsageLogService.findAll();
    return {
      message: 'Coupon usage logs retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Get('coupon/:couponCode')
  @ApiOperation({ summary: 'Get coupon usage logs by coupon code' })
  @ApiOkResponse({
    description: 'Coupon usage logs for the coupon retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CouponUsageLogResponseDto) },
            },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'No logs found for this coupon' })
  async getCouponUsageLogsByCode(
    @Param('couponCode') couponCode: string,
  ): Promise<ApiResponseDto<CouponUsageLog[]>> {
    const data = await this.couponUsageLogService.findByCouponCode(couponCode);
    return {
      message: `Coupon usage logs for ${couponCode} retrieved successfully`,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Get('stats/:couponCode')
  @ApiOperation({ summary: 'Get coupon usage statistics by coupon code' })
  @ApiOkResponse({
    description: 'Coupon usage statistics retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  async getCouponUsageStats(
    @Param('couponCode') couponCode: string,
  ): Promise<ApiResponseDto<any>> {
    const data = await this.couponUsageLogService.getCouponUsageStats(couponCode);
    return {
      message: `Coupon usage statistics for ${couponCode} retrieved successfully`,
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get coupon usage log by ID' })
  @ApiOkResponse({
    description: 'Coupon usage log retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CouponUsageLogResponseDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Coupon usage log not found' })
  async getCouponUsageLogById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CouponUsageLog>> {
    const data = await this.couponUsageLogService.findOne(+id);
    return {
      message: 'Coupon usage log retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
