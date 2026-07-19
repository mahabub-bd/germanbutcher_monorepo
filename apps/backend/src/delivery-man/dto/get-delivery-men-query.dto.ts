import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDeliveryMenQueryDto {
  @ApiProperty({
    description: 'Search by name or mobile number',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Page number',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}
