// src/product/dto/category-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the category',
  })
  id: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Name of the category',
    maxLength: 255,
  })
  name: string;

  @ApiPropertyOptional({
    example: 'electronics',
    description: 'URL-friendly slug for the category',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Electronic devices and accessories',
    description: 'Description of the category',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/electronics.jpg',
    description: 'URL of the category image',
    format: 'uri',
  })
  imageUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the category is active',
    default: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    type: () => CategoryResponseDto,
    description: 'Parent category (main category if this is a subcategory)',
  })
  parent?: CategoryResponseDto;

  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp',
    readOnly: true,
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update timestamp',
    readOnly: true,
  })
  updatedAt: Date;
}
