import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

class CheckItemDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckFreeDeliveryDto {
  @ApiProperty({ example: 750 })
  @IsNumber()
  @Min(0)
  payableSubtotal: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  totalQuantity: number;

  @ApiProperty({ isArray: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CheckItemDto)
  items: CheckItemDto[];
}
