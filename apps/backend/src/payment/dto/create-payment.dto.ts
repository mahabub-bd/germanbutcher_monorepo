import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'Purchase ID' })
  @IsNumber()
  purchaseId: number;

  @ApiProperty({ example: 5000, description: 'Amount paid' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2023-05-15', description: 'Date of payment' })
  @IsDateString()
  paymentDate: Date;

  @ApiProperty({
    example: 1,
    description: 'Payment method ID',
  })
  @IsNotEmpty()
  @IsNumber()
  paymentMethodId: number;

  @ApiPropertyOptional({
    example: 'TRX123456789',
    description: 'Transaction reference',
  })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({
    example: 'Paid via bank transfer',
    description: 'Payment notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
