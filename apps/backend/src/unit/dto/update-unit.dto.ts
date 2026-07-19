import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUnitDto } from './create-unit.dto';

export class UpdateUnitDto extends PartialType(CreateUnitDto) {
  @ApiPropertyOptional({
    description: 'ID of the user updating the unit',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}
