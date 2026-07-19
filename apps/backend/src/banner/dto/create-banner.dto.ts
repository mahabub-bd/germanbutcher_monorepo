import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { BannerPosition, BannerType } from '../entities/banner.entity';

export class CreateBannerDto {
  @ApiProperty({
    example: 'Summer Sale 2023',
    description: 'Title of the banner',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Get 50% off on all summer collections',
    description: 'Subtitle or description of the banner',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '/summer-sale',
    description: 'URL to redirect when banner is clicked',
  })
  @IsUrl()
  @IsOptional()
  targetUrl?: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the image attachment',
  })
  @IsNumber()
  imageId: number;

  @ApiProperty({
    enum: BannerPosition,
    example: BannerPosition.TOP,
    description: 'Position where banner should be displayed',
  })
  @IsEnum(BannerPosition)
  position: BannerPosition;

  @ApiProperty({
    enum: BannerType,
    example: BannerType.MAIN,
    description: 'Type of banner',
  })
  @IsEnum(BannerType)
  type: BannerType;

  @ApiProperty({
    example: true,
    description: 'Whether the banner is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 0,
    description: 'Display order/priority of the banner',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}
