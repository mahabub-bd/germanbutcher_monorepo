import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DiscountType } from 'src/common/enums';

export class CreateCouponDto {
  @ApiProperty({
    example: 'SUMMER25',
    description: 'Unique coupon code',
  })
  @IsString()
  code: string;

  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    description: 'Type of discount',
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    minimum: 0,
    example: 25,
    description: 'Discount value (percentage or fixed amount)',
  })
  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  maxDiscountAmount?: number;

  @ApiProperty({
    required: false,
    example: 100,
    description: 'Minimum order amount required to apply this coupon',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({
    required: false,
    example: 100,
    description: 'Maximum number of times coupon can be used',
  })
  @IsOptional()
  @IsNumber()
  maxUsage?: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Coupon validity start date',
  })
  @Type(() => Date)
  @IsDate()
  validFrom: Date;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: 'Coupon expiration date',
  })
  @Type(() => Date)
  @IsDate()
  validUntil: Date;

  @ApiProperty({
    required: false,
    default: true,
    description: 'Whether coupon is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    required: false,
    type: [Number],
    description: 'Array of product IDs to exclude from coupon discount',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  excludedItemIds?: number[];
}
