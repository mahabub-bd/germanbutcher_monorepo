import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CouponUsageLogResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: 16 })
  couponId?: number;

  @ApiProperty({ example: 'SUMMER25' })
  couponCode: string;

  @ApiPropertyOptional({ example: 123 })
  orderId?: number;

  @ApiPropertyOptional({ example: 'ORD-2024-0001' })
  orderNo?: string;

  @ApiPropertyOptional({ example: 1 })
  userId?: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  userName?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  userEmail?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  userMobileNumber?: string;

  @ApiProperty({ example: 25.5, description: 'Discount amount applied' })
  discountAmount: number;

  @ApiProperty({ example: 100.0, description: 'Order total before discount' })
  orderTotal: number;

  @ApiPropertyOptional({ example: 'PERCENTAGE' })
  discountType?: string;

  @ApiPropertyOptional({ example: 25 })
  discountValue?: number;

  @ApiProperty({ example: '2023-05-15T10:00:00Z' })
  createdAt: Date;
}
