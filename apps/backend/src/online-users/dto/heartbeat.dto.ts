import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class HeartbeatDto {
  @ApiPropertyOptional({
    description: 'Browser-generated visitor ID (persisted in localStorage)',
    example: '3f8a2c1e-9b4d-4e7a-8f2b-6c1d5a9e0b3f',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  visitorId?: string;

  @ApiPropertyOptional({
    description: 'Page path the visitor is currently on',
    example: '/products/fresh-sausage',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  page?: string;
}
