import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFreeDeliveryCampaignDto {
  @ApiProperty({ example: 'Meat Friday Night' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-09-28T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2026-10-15T17:59:00.000Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    example: [5],
    description: 'Days of week (0=Sunday..6=Saturday); empty/omitted = every day',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsIn([0, 1, 2, 3, 4, 5, 6], { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:mm' })
  startTime?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:mm' })
  endTime?: string;

  @ApiPropertyOptional({ example: 500, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  newCustomersOnly?: boolean;

  @ApiPropertyOptional({ example: [1, 2], description: 'Specific products; empty = any product' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  productIds?: number[];

  @ApiPropertyOptional({ example: [3], description: 'Categories; empty = any category' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  categoryIds?: number[];
}
