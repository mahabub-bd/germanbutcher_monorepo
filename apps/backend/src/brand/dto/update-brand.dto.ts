import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateBrandDto {
  @ApiPropertyOptional({
    example: 'Nike',
    description: 'Name of the brand',
    maxLength: 255,
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'American multinational corporation',
    description: 'Description of the brand',
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://your-s3-bucket.s3.amazonaws.com/brands/logo-123.png',
    description: 'URL of the brand logo',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the brand is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
