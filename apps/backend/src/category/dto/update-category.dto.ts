// src/product/dto/update-category.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({
    example: 'Electronics & Gadgets',
    description: 'Updated name of the category',
  })
  name?: string;
}
