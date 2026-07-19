import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class InitiateRefundDto {
  @ApiProperty({ example: 1, description: 'Original payment ID to refund' })
  @IsNumber()
  @IsNotEmpty()
  paymentId: number;

  @ApiProperty({ example: 10, description: 'Refund amount' })
  @IsNumber()
  @IsNotEmpty()
  refund_amount: number;

  @ApiProperty({
    example: 'Refund for order cancellation',
    description: 'Reason for refund',
  })
  @IsString()
  @IsOptional()
  refund_remarks?: string;

  @ApiProperty({
    example: '2451771336715297',
    description: 'Bank transaction ID from the original payment',
  })
  @IsString()
  @IsNotEmpty()
  bank_tran_id: string;

  @ApiProperty({
    example: '2441771334284073',
    description: 'SSLCommerz transaction ID (tran_id) from the original payment',
  })
  @IsString()
  @IsNotEmpty()
  tran_id: string;
}
