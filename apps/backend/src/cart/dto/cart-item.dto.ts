// src/cart/dto/add-cart-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the product to add to cart',
    type: Number,
    required: true,
  })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({
    example: 1,
    description: 'Quantity to add to cart',
    type: Number,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsPositive()
  quantity: number = 1;
}
