import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Lightweight DTO for active banners
 * Only includes essential fields for frontend display
 */
export class ActiveBannerDto {
  @ApiProperty({ example: 23, description: 'Banner ID' })
  id: number;

  @ApiProperty({ example: 'Steak Offer', description: 'Banner title' })
  title: string;

  @ApiPropertyOptional({ example: 'Special promotion', description: 'Banner description' })
  description?: string;

  @ApiProperty({
    example: 'https://germanbutcherbd.com/categories/marinated-meats',
    description: 'Target URL when banner is clicked',
  })
  targetUrl: string;

  @ApiProperty({
    example: 'middle',
    description: 'Banner position for layout',
    enum: ['top', 'middle', 'bottom', 'sidebar'],
  })
  position: string;

  @ApiProperty({
    example: 'promotional',
    description: 'Banner type',
    enum: ['main', 'promotional', 'announcement'],
  })
  type: string;

  @ApiProperty({ example: true, description: 'Is banner active' })
  isActive: boolean;

  @ApiProperty({ example: 1, description: 'Display order for sorting' })
  displayOrder: number;

  @ApiProperty({
    example: 'https://germanbutcher.s3.ap-southeast-1.amazonaws.com/04b2e751-5b72-4c9c-8228-6f535da89888.jpg',
    description: 'Banner image URL',
  })
  imageUrl: string;
}
