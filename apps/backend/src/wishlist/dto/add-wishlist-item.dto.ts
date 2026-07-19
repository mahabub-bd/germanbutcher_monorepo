import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AddWishlistItemDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the product to add to wishlist',
    type: Number,
    required: true,
  })
  @IsInt()
  @IsPositive()
  productId: number;
}
