import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsNotEmpty } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  productId: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;
}
