import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class StockAdjustDto {
  @ApiProperty({
    description:
      'Signed adjustment quantity: positive adds stock, negative removes it',
    example: 5,
  })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reason for the adjustment (shown in the movement ledger)',
    example: 'Damaged items removed',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
