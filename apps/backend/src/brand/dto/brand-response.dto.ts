import { ApiProperty } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the brand',
  })
  id: number;

  @ApiProperty({
    example: 'Nike',
    description: 'Name of the brand',
  })
  name: string;

  @ApiProperty({
    example: 'American multinational corporation',
    description: 'Description of the brand',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logos/nike.png',
    description: 'URL of the brand logo',
    required: false,
  })
  logoUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the brand is active',
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp of the brand record',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update timestamp of the brand record',
  })
  updatedAt: Date;
}
