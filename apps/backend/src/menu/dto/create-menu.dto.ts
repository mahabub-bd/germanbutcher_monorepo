// src/menu/dto/create-menu.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ example: 'Dashboard', description: 'Name of the menu' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Parent menu ID',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({
    example: 'fa-dashboard',
    description: 'Icon class',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiProperty({
    example: '/dashboard',
    description: 'URL path',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  url?: string;

  @ApiProperty({
    example: 1,
    description: 'Display order',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    example: true,
    description: 'Is main menu item',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMainMenu?: boolean;

  @ApiProperty({
    example: true,
    description: 'Is menu active',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: false,
    description: 'Is admin menu item',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAdminMenu?: boolean;
}
