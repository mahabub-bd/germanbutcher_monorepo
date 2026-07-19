import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QuerySalesPointDto {
  @ApiPropertyOptional({
    description: 'Global search in sales point name, description, or email',
    example: 'Shwapno',
  })
  @IsOptional()
  @IsString()
  shopSearch?: string;

  @ApiPropertyOptional({
    description: 'Filter by division',
    example: 'Dhaka',
  })
  @IsOptional()
  @IsString()
  division?: string;

  @ApiPropertyOptional({
    description: 'Filter by district',
    example: 'Dhaka',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
