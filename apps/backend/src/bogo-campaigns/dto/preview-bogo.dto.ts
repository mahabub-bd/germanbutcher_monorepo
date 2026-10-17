import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

class PreviewItemDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class PreviewBogoDto {
  @ApiProperty({ isArray: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PreviewItemDto)
  items: PreviewItemDto[];
}
