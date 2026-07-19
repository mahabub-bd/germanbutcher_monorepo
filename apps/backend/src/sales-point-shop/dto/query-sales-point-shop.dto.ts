import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class QuerySalesPointShopDto {
  @ApiPropertyOptional({
    description: 'Filter by sales point ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Sales point ID must be an integer' })
  @Min(1, { message: 'Sales point ID must be greater than 0' })
  salesPointId?: number;

  @ApiPropertyOptional({
    description: 'Filter by shop name (partial match, case insensitive)',
    example: 'Dhanmondi',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Shop name must be a string' })
  @Length(2, 255, { message: 'Shop name must be between 2 and 255 characters' })
  shopName?: string;

  @ApiPropertyOptional({
    description: 'Filter by division name (partial match, case insensitive)',
    example: 'Dhaka',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Division must be a string' })
  @Length(2, 100, { message: 'Division must be between 2 and 100 characters' })
  division?: string;

  @ApiPropertyOptional({
    description: 'Filter by district name (partial match, case insensitive)',
    example: 'Dhaka',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'District must be a string' })
  @Length(2, 100, { message: 'District must be between 2 and 100 characters' })
  district?: string;

  @ApiPropertyOptional({
    description: 'Filter by address (partial match, case insensitive)',
    example: 'Road 15, Dhanmondi',
    minLength: 2,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @Length(2, 500, { message: 'Address must be between 2 and 500 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than 0' })
  @Max(1000, { message: 'Page cannot exceed 1000' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Include sales point details in response',
    example: false,
    default: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeSalesPoint must be a boolean value' })
  includeSalesPoint?: boolean = false;

  @ApiPropertyOptional({
    description: 'Sort field for ordering results',
    example: 'createdAt',
    enum: [
      'id',
      'shopName',
      'division',
      'district',
      'address',
      'createdAt',
      'updatedAt',
      'isActive',
    ],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  @IsIn(
    [
      'id',
      'shopName',
      'division',
      'district',
      'address',
      'createdAt',
      'updatedAt',
      'isActive',
    ],
    {
      message:
        'Sort field must be one of: id, shopName, division, district, address, createdAt, updatedAt, isActive',
    },
  )
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order for ordering results',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(['ASC', 'DESC'], {
    message: 'Sort order must be either ASC or DESC',
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'General search query (searches across shop name and address)',
    example: 'dhanmondi',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @Length(2, 255, {
    message: 'Search query must be between 2 and 255 characters',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Date range filter - start date (ISO string)',
    example: '2023-01-01T00:00:00.000Z',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Date from must be a valid date string' })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Date range filter - end date (ISO string)',
    example: '2023-12-31T23:59:59.999Z',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Date to must be a valid date string' })
  dateTo?: string;
}
