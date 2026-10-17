import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBogoCampaignDto {
  @ApiProperty({ example: 'Weekend BOGO' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-10-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2026-10-21T23:59:00.000Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ example: 2, description: 'Units to buy per free group' })
  @IsInt()
  @Min(1)
  buyQuantity: number;

  @ApiProperty({ example: 1, description: 'Free units per group' })
  @IsInt()
  @Min(1)
  getQuantity: number;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description:
      'Maximum free groups a single order can earn; 0 = unlimited. E.g. buy 1 get 1 with 1 = at most one free unit per order.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxGroupsPerOrder?: number;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Maximum uses; 0 = unlimited',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxUsage?: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Eligible products; empty (with categories) = whole catalog',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  productIds?: number[];

  @ApiPropertyOptional({ example: [3], description: 'Eligible categories' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  categoryIds?: number[];
}
