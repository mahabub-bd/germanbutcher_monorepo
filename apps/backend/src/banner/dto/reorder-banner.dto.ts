import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class ReorderBannersDto {
  @ApiProperty({
    type: [Number],
    example: [3, 1, 2],
    description:
      'Banner IDs in the desired display order — each position becomes the displayOrder',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  ids: number[];
}
