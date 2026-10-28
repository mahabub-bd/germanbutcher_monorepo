import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CrmActivityStatus, CrmActivityType } from 'src/common/enums';

export class CreateActivityDto {
  @ApiProperty({ enum: CrmActivityType })
  @IsEnum(CrmActivityType)
  type: CrmActivityType;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Due date, tasks only (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: CrmActivityStatus })
  @IsOptional()
  @IsEnum(CrmActivityStatus)
  status?: CrmActivityStatus;
}
