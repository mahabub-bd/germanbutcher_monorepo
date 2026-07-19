import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreatePurchaseDto } from './create-purchase.dto';

export class UpdatePurchaseDto extends CreatePurchaseDto {
  @ApiProperty({
    example: 'delivered',
    description: 'Purchase status',
    required: false,
  })
  @IsString()
  status?: string;
}
