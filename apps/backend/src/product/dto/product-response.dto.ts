import { ApiProperty } from '@nestjs/swagger';
import { BrandResponseDto } from 'src/brand/dto/brand-response.dto';
import { CategoryResponseDto } from 'src/category/dto/category-response.dto';

export class ProductResponseDto {
  @ApiProperty({ example: 1, description: 'The ID of the product' })
  id: number;

  @ApiProperty({
    example: 'Premium Widget',
    description: 'Name of the product',
  })
  name: string;

  @ApiProperty({
    example: 'High-quality widget with advanced features',
    description: 'Description of the product',
    required: false,
  })
  description?: string;

  @ApiProperty({ example: 99.99, description: 'Price of the product' })
  price: number;

  @ApiProperty({ example: 100, description: 'Available stock quantity' })
  stock: number;

  @ApiProperty({
    example: 'https://example.com/images/widget.jpg',
    description: 'URL of the product image',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the product is active',
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    type: CategoryResponseDto,
    description: 'Category of the product',
  })
  category: CategoryResponseDto;

  @ApiProperty({ type: BrandResponseDto, description: 'Brand of the product' })
  brand: BrandResponseDto;

  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
