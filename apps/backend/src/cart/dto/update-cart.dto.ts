import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    example: 3,
    description: 'New quantity for the item',
    type: Number,
    minimum: 1,
    required: true,
  })
  @IsInt()
  @Min(1)
  @IsPositive()
  @IsNotEmpty()
  quantity: number;
}
