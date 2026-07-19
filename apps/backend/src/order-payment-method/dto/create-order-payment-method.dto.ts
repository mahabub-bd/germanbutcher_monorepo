// src/order-payment-method/dto/create-order-payment-method.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderPaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Cash on Delivery' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'cash_on_delivery' })
  code: string;

  @IsBoolean()
  @ApiProperty({ example: true })
  isActive: boolean;

  @IsString()
  @ApiProperty({ example: 'Pay when product is delivered', required: false })
  description?: string;
}
