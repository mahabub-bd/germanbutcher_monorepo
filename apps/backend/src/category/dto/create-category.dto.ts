// src/product/dto/create-category.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'Name of the category',
    required: true,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'sportswear',
    description: 'URL-friendly slug for the Category',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Electronic devices and accessories',
    description: 'Description of the category',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'ID of parent category',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/images/electronics.jpg',
    description: 'URL of the category image',
    format: 'uri',
  })
  @ApiPropertyOptional({
    example: '1',
    description: 'ID of the logo attachment',
  })
  @IsOptional()
  @IsString()
  attachmentId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the category is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
