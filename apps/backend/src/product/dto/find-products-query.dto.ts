import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsIn,
  Min,
} from 'class-validator';

export class FindProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  brandId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'name_asc', 'name_desc'])
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasDiscount?: boolean;

  @IsOptional()
  @IsString()
  tags?: string;
}
