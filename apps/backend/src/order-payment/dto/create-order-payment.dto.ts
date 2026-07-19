import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrderPaymentDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the order being paid',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  orderId: number;

  @ApiProperty({
    example: 99.99,
    description: 'Payment amount (positive number with up to 2 decimal places)',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the payment method used',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  paymentMethodId: number;

  @ApiPropertyOptional({
    example: 'TRX-123456',
    description: 'Payment reference/transaction number (max 50 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message:
      'Reference number can only contain letters, numbers, hyphens and underscores',
  })
  referenceNumber?: string;

  @ApiPropertyOptional({
    example: 'Paid via Stripe payment gateway',
    description: 'Additional payment notes (max 500 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
