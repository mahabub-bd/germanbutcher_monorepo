import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Nike',
    required: true,
    description: 'Name of the brand',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'nike-sportswear',
    description: 'URL-friendly slug for the brand',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    example: 'American multinational corporation',
    description: 'Description of the brand',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://www.nike.com',
    description: 'Official website URL',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'ID of the logo attachment',
  })
  @IsOptional()
  @IsString()
  @IsNumber()
  attachmentId?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the brand is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
