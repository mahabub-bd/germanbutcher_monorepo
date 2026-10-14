import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DiscountType } from 'src/common/enums/index';

export class CreateFlashSaleCampaignDto {
  @ApiProperty({ example: 'Eid Flash Sale' })
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

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 20, description: 'Discount amount (% or fixed ৳)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Maximum uses; 0 = unlimited',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxUsage?: number;

  @ApiPropertyOptional({ example: [1, 2], description: 'Specific products' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  productIds?: number[];

  @ApiPropertyOptional({ example: [3], description: 'Categories (whole category on sale)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  categoryIds?: number[];
}
