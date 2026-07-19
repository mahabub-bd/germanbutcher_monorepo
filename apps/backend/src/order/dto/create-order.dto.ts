import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: 'ID of the shipping address' })
  @IsNotEmpty()
  addressId: number;

  @ApiProperty({ example: 5, description: 'ID of the user placing the order' })
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    example: 2,
    description: 'ID of the selected shipping method',
  })
  @IsNotEmpty()
  shippingMethodId: number;

  @ApiProperty({ example: 3, description: 'ID of the selected payment method' })
  @IsNotEmpty()
  paymentMethodId: number;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'List of items in the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    example: 10,
    description: 'Optional coupon ID for discount',
  })
  @IsOptional()
  couponId?: number;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'Initial payment amount at order creation',
    type: Number,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidAmount?: number = 0;
}
