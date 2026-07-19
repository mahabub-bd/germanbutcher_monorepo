// Create this file: src/user/dto/top-customers-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum TopCustomersSortBy {
  ORDERS = 'orders',
  SPENDING = 'spending',
}

export enum TimeFilter {
  THIS_MONTH = 'this_month',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  THIS_YEAR = 'this_year',
  ALL_TIME = 'all_time',
}

export class TopCustomersQueryDto {
  @ApiPropertyOptional({
    description: 'Number of top customers to return',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by total orders or total spending',
    enum: TopCustomersSortBy,
    default: TopCustomersSortBy.ORDERS,
    example: TopCustomersSortBy.ORDERS,
  })
  @IsOptional()
  @IsEnum(TopCustomersSortBy)
  sortBy?: TopCustomersSortBy = TopCustomersSortBy.ORDERS;

  @ApiPropertyOptional({
    description: 'Filter by time period',
    enum: TimeFilter,
    default: TimeFilter.ALL_TIME,
    example: TimeFilter.THIS_MONTH,
  })
  @IsOptional()
  @IsEnum(TimeFilter)
  timeFilter?: TimeFilter = TimeFilter.ALL_TIME;
}
