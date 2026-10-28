import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CrmCampaignChannel,
  CrmSegment,
} from 'src/common/enums';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: CrmCampaignChannel })
  @IsEnum(CrmCampaignChannel)
  channel: CrmCampaignChannel;

  /** Null / omitted targets every customer. */
  @ApiProperty({ enum: CrmSegment, nullable: true })
  @IsOptional()
  @IsEnum(CrmSegment)
  segment?: CrmSegment | null;

  @ApiPropertyOptional({ description: 'Email subject (email campaigns only)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string | null;

  @ApiProperty({ description: 'Message body' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
