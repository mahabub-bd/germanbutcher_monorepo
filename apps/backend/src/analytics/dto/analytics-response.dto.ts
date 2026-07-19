import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopEndpointDto {
  @ApiProperty({ example: '/v1/products' })
  endpoint: string;

  @ApiProperty({ example: 'GET' })
  method: string;

  @ApiProperty({ example: 15234 })
  count: number;

  @ApiProperty({ example: 89 })
  avgResponseTime: number;
}

export class ResponseTimeMetricsDto {
  @ApiProperty({ example: 125 })
  avg: number;

  @ApiProperty({ example: 45 })
  min: number;

  @ApiProperty({ example: 850 })
  max: number;
}

export class PeakTrafficDto {
  @ApiProperty({ example: '14:00' })
  hour: string;

  @ApiProperty({ example: 4523 })
  requestCount: number;
}

export class RequestsPerMinuteDto {
  @ApiProperty({ example: '14:30' })
  minute: string;

  @ApiProperty({ example: 45 })
  count: number;
}

export class AnalyticsOverviewDto {
  @ApiProperty({ example: 45 })
  requestsPerMinute: number;

  @ApiProperty({ example: 64800 })
  totalRequests: number;

  @ApiProperty({ example: 1234 })
  uniqueVisitors: number;

  @ApiProperty({ example: '14:00' })
  peakHour: string;

  @ApiProperty({ example: '/v1/products' })
  topEndpoint: string;

  @ApiProperty({ example: 125 })
  avgResponseTime: number;

  @ApiProperty({ example: '24h' })
  period: string;
}
