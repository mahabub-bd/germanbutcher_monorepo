import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({
    example: 'SUMMER20',
    description: 'Coupon code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    type: 'array',
    description: 'Cart items with productId and price',
    example: [
      { productId: 1, price: 450 },
      { productId: 2, price: 840 },
    ],
  })
  @IsArray()
  cartItems: { productId: number; price: number }[];
}
