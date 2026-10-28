import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CrmSegment } from 'src/common/enums';

export class CrmCustomersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by name, email or mobile' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CrmSegment })
  @IsOptional()
  @IsEnum(CrmSegment)
  segment?: CrmSegment;

  @ApiPropertyOptional({
    enum: ['last_order_at', 'total_spent', 'order_count', 'name'],
    default: 'total_spent',
  })
  @IsOptional()
  @IsIn(['last_order_at', 'total_spent', 'order_count', 'name'])
  sortBy?: string = 'total_spent';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
