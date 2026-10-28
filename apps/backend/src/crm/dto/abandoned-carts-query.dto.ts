import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class AbandonedCartsQueryDto {
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

  @ApiPropertyOptional({ default: 1, description: 'Minimum item count in cart' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minItems?: number = 1;

  @ApiPropertyOptional({
    default: 3,
    description: 'Cart untouched for at least this many days',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minDays?: number = 3;

  @ApiPropertyOptional({
    default: false,
    description: 'Include customers currently online',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeOnline?: boolean = false;
}
