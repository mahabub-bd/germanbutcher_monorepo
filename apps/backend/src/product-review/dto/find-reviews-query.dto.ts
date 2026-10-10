import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FindReviewsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['all', 'pending', 'approved', 'rejected'])
  status?: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

  @IsOptional()
  @IsString()
  search?: string;
}
