import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

// create-sales-partner.dto.ts
export class CreateSalesPartnerDto {
  @ApiProperty({ description: 'Name of the sales partner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the sales partner',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Order of the client' })
  @IsNumber()
  order: number;

  @ApiProperty({
    description: 'Website URL of the sales partner',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ description: 'Image attachment ID for the sales partner' })
  @IsNumber()
  @IsNotEmpty()
  Image: number; // This should match your JSON payload

  @ApiProperty({
    description: 'Is the sales partner active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
