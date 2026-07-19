import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DiscountType } from 'src/common/enums';

export class CreateProductDto {
  @ApiProperty({
    example: 'Premium Wireless Headphones',
    description: 'Name of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'nike-sportswear',
    description: 'URL-friendly slug for the brand',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Noise cancelling Bluetooth headphones with 30hr battery life',
    description: 'Detailed description of the product',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example:
      'Product includes noise cancellation, Bluetooth connectivity, and long battery life.',
    description: 'Additional content or details about the product',
  })
  @IsOptional()
  @IsString()
  productDetails?: string;

  @ApiProperty({
    example: 199.99,
    description: 'Price of the product in USD',
    minimum: 0.01,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  sellingPrice: number;

  @ApiProperty({
    example: 50,
    description: 'Available quantity in stock',
    minimum: 0,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  stock: number;

  @ApiProperty({
    description: 'Unit of measurement for the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  unitId: string;

  @ApiProperty({
    example: 'supplier-id-12345',
    description: 'ID of the supplier providing the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  supplierId: string;

  @ApiPropertyOptional({
    example: 'PRD-ABC123',
    description: 'Unique SKU for the product (auto-generated if not provided)',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productSku?: string;

  @ApiPropertyOptional({
    example: '1105',
    description: 'Attachment ID of the product image',
  })
  @IsOptional()
  @IsString()
  attachment?: string;

  @ApiProperty({
    example: '6',
    description: 'ID of the gallery associated with the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  galleryId: string;

  @ApiPropertyOptional({
    example: 2.5,
    description: 'Product weight in kilograms',
    type: 'number',
    format: 'double',
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Weight must be a number with max 2 decimal places',
    },
  )
  @IsPositive({ message: 'Weight must be a positive number' })
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is active and visible to customers',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is featured',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID of the category this product belongs to',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the brand this product belongs to',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  brandId: number;

  @ApiPropertyOptional({
    enum: DiscountType,
    description: 'Type of discount to apply',
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({
    description: 'Discount value (percentage or fixed amount)',
    type: Number,
    example: 15.5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @ValidateIf((o) => o.discountType)
  discountValue?: number;

  @ApiPropertyOptional({
    description: 'Discount start date',
    type: Date,
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  discountStartDate?: Date;

  @ApiPropertyOptional({
    description: 'Discount end date',
    type: Date,
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ValidateIf((o) => o.discountStartDate)
  discountEndDate?: Date;

  @ApiPropertyOptional({
    example: ['organic', 'gluten-free', 'premium'],
    description: 'Tags for categorizing and filtering products',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
