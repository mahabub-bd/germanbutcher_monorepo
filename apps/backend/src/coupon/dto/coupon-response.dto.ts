import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';

class ExcludedItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Product Name' })
  name: string;
}

export class CouponResponseDto extends CreateCouponDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique coupon identifier',
  })
  id: string;

  @ApiProperty({
    example: 0,
    description: 'Number of times coupon has been used',
  })
  timesUsed: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [ExcludedItemDto],
    description: 'Products excluded from coupon discount',
    nullable: true,
  })
  excludedItems?: ExcludedItemDto[];
}
