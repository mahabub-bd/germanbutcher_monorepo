import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty({
    example: 'bank_transfer',
    description: 'Unique code for the payment method',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Bank Transfer',
    description: 'Display name of the payment method',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Payment via bank transfer',
    description: 'Description of the payment method',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the payment method is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
