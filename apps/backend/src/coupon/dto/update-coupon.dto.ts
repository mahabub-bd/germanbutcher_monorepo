import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DiscountType } from 'src/common/enums';

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsNumber()
  @IsOptional()
  maxDiscountAmount?: number;

  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  maxUsage?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validFrom?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validUntil?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  excludedItemIds?: number[];
}
