import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsNumber()
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
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Activation status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description:
      'When true, orders with this method must pay online (cash on delivery rejected)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresOnlinePayment?: boolean;

  @ApiProperty({
    description:
      "When true, free-delivery campaigns never waive this method's cost",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isExcludedFromFreeDelivery?: boolean;

  @ApiProperty({
    description: 'Display order (lower numbers show first)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiProperty({
    description:
      'When true, the customer collects the order (no shipping involved)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPickup?: boolean;
}
