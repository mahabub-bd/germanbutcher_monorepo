import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSalesPointDto {
  @ApiProperty({ example: 'Shwapno' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Order of the sales shop' })
  @IsNumber()
  order: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Attachment ID for company logo',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  logoAttachmentId?: number;

  @ApiPropertyOptional({ example: 'Leading retail chain in Bangladesh' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://www.shwapno.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ example: '+880-123-456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactNumber?: string;

  @ApiPropertyOptional({ example: 'info@shwapno.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;
}
