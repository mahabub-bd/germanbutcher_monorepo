import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiResponseDto } from 'src/common/types';
import { FlashSaleUsageLogService } from './flash-sale-usage-log.service';
import { FlashSaleUsageLog } from './entities/flash-sale-usage-log.entity';

@ApiTags('Flash Sale Usage Logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ModulePermissions('/admin/marketing/flash-sale-usage-logs')
@Controller('flash-sale-usage-logs')
@ApiBearerAuth('token')
export class FlashSaleUsageLogController {
  constructor(
    private readonly usageLogService: FlashSaleUsageLogService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all flash sale campaign usage logs' })
  @ApiOkResponse({
    description: 'Flash sale usage logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/FlashSaleUsageLog' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'campaignId',
    required: false,
    type: Number,
    description: 'Filter logs to a single campaign',
  })
  @ApiQuery({ name: 'fromDate', required: false, type: String, example: '2026-10-01' })
  @ApiQuery({ name: 'toDate', required: false, type: String, example: '2026-10-14' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('campaignId') campaignId?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<ApiResponseDto<FlashSaleUsageLog[]>> {
    const { data, total } = await this.usageLogService.findAll({
      page: +page,
      limit: +limit,
      campaignId: campaignId ? +campaignId : undefined,
      fromDate,
      toDate,
    });

    return {
      message: 'Flash sale usage logs retrieved successfully',
      statusCode: 200,
      data,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / +limit) || 1,
    };
  }

  @Get('report-stats')
  @ApiOperation({
    summary: 'Get flash sale usage report stats',
    description:
      'Aggregated flash sale usage statistics (total uses, discount given, order value) across all campaigns, optionally filtered by date range and campaign',
  })
  @ApiQuery({ name: 'fromDate', required: false, type: String, example: '2026-10-01' })
  @ApiQuery({ name: 'toDate', required: false, type: String, example: '2026-10-14' })
  @ApiQuery({ name: 'campaignId', required: false, type: Number })
  @ApiOkResponse({
    description: 'Flash sale report stats retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            totalUses: { type: 'number', example: 18 },
            totalDiscount: { type: 'number', example: 2160 },
            totalOrderValue: { type: 'number', example: 86400 },
            avgOrderValue: { type: 'number', example: 4800 },
            uniqueCampaigns: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  async getReportStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('campaignId') campaignId?: number,
  ) {
    const data = await this.usageLogService.getReportStats({
      fromDate,
      toDate,
      campaignId: campaignId ? +campaignId : undefined,
    });
    return {
      message: 'Flash sale report stats retrieved successfully',
      statusCode: 200,
      data,
    };
  }
}
