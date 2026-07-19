import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CancellationReason } from 'src/common/enums';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancelling the order',
    enum: CancellationReason,
    example: CancellationReason.CUSTOMER_REQUEST,
  })
  @IsEnum(CancellationReason)
  @IsNotEmpty()
  reason: CancellationReason;

  @ApiPropertyOptional({
    description: 'Additional notes or explanation for the cancellation',
    example: 'Customer requested to cancel due to change of mind',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
