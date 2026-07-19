import {
  Controller,
  Get,
  HttpStatus,
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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SkipAnalytics } from 'src/common/decorators/skip-analytics.decorator';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsOverviewDto,
  PeakTrafficDto,
  ResponseTimeMetricsDto,
  TopEndpointDto,
} from './dto/analytics-response.dto';

@ApiTags('Analytics')
@Controller('analytics')
@ApiBearerAuth('token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Roles('superadmin')
@SkipAnalytics()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get analytics overview',
    description:
      'Returns a comprehensive overview including requests/min, total requests, unique visitors, peak hour, top endpoint, and avg response time',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (1h, 24h, 7d, 30d)',
    example: '24h',
    enum: ['1h', '24h', '7d', '30d'],
  })
  @ApiOkResponse({
    description: 'Analytics overview retrieved successfully',
    type: AnalyticsOverviewDto,
  })
  async getOverview(
    @Query('period') period: string = '24h',
  ) {
    const data = await this.analyticsService.getOverview(period);
    return this.formatResponse(
      'Analytics overview retrieved successfully',
      HttpStatus.OK,
      data,
    );
  }

  @Get('requests')
  @ApiOperation({
    summary: 'Get request metrics over time',
    description:
      'Returns request count per minute (for 1h/24h) or per hour (for 7d/30d)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (1h, 24h, 7d, 30d)',
    example: '24h',
    enum: ['1h', '24h', '7d', '30d'],
  })
  @ApiOkResponse({
    description: 'Request metrics retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          time: { type: 'string', example: '14:30' },
          count: { type: 'number', example: 45 },
        },
      },
    },
  })
  async getRequestMetrics(@Query('period') period: string = '24h') {
    const data = await this.analyticsService.getRequestMetrics(period);
    return this.formatResponse(
      'Request metrics retrieved successfully',
      HttpStatus.OK,
      data,
    );
  }

  @Get('peak-traffic')
  @ApiOperation({
    summary: 'Get peak traffic hours',
    description: 'Returns the top 24 busiest hours within the specified period',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (1h, 24h, 7d, 30d)',
    example: '7d',
    enum: ['1h', '24h', '7d', '30d'],
  })
  @ApiOkResponse({
    description: 'Peak traffic data retrieved successfully',
    type: [PeakTrafficDto],
  })
  async getPeakTraffic(@Query('period') period: string = '7d') {
    const data = await this.analyticsService.getPeakTraffic(period);
    return this.formatResponse(
      'Peak traffic data retrieved successfully',
      HttpStatus.OK,
      data,
    );
  }

  @Get('visitors')
  @ApiOperation({
    summary: 'Get unique visitors',
    description: 'Returns unique visitor count per day',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (1h, 24h, 7d, 30d)',
    example: '7d',
    enum: ['1h', '24h', '7d', '30d'],
  })
  @ApiOkResponse({
    description: 'Unique visitors data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', example: 'Jan 15' },
          count: { type: 'number', example: 234 },
        },
      },
    },
  })
  async getUniqueVisitors(@Query('period') period: string = '7d') {
    const data = await this.analyticsService.getUniqueVisitors(period);
    return this.formatResponse(
      'Unique visitors data retrieved successfully',
      HttpStatus.OK,
      data,
    );
  }

  @Get('top-endpoints')
  @ApiOperation({
    summary: 'Get top endpoints',
    description: 'Returns the most accessed endpoints with request counts and average response times',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of endpoints to return',
    example: 10,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Top endpoints retrieved successfully',
    type: [TopEndpointDto],
  })
  async getTopEndpoints(@Query('limit') limit: number = 10) {
    const data = await this.analyticsService.getTopEndpoints(limit);
    return this.formatResponse(
      'Top endpoints retrieved successfully',
      HttpStatus.OK,
      data,
      { limit },
    );
  }

  @Get('response-times')
  @ApiOperation({
    summary: 'Get response time metrics',
    description: 'Returns average, minimum, and maximum response times',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (1h, 24h, 7d, 30d)',
    example: '24h',
    enum: ['1h', '24h', '7d', '30d'],
  })
  @ApiOkResponse({
    description: 'Response time metrics retrieved successfully',
    type: ResponseTimeMetricsDto,
  })
  async getResponseTimeMetrics(@Query('period') period: string = '24h') {
    const data = await this.analyticsService.getResponseTimeMetrics(period);
    return this.formatResponse(
      'Response time metrics retrieved successfully',
      HttpStatus.OK,
      data,
    );
  }

  private formatResponse(
    message: string,
    statusCode: number,
    data: any,
    meta?: { limit?: number },
  ) {
    const response: any = {
      message,
      statusCode,
      data,
    };
    if (meta) {
      Object.assign(response, meta);
    }
    return response;
  }
}
