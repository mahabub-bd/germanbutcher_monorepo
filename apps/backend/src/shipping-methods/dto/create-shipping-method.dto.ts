import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateShippingMethodDto {
  @ApiProperty({
    description: 'Unique name of the shipping method',
    example: 'Express Delivery',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Shipping cost in decimal format',
    example: 15.99,
    type: 'number',
    format: 'decimal',
    required: true,
  })
  cost: number;

  @ApiProperty({
    description: 'Estimated delivery time range',
    example: '3-5 business days',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  deliveryTime: string;

  @ApiProperty({
    description: 'Optional description of the shipping method',
    example: 'Priority shipping with tracking',
    required: false,
  })
  @IsString()
  description?: string;
}
