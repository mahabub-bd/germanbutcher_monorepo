import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMenuPermissionDto {
  @ApiProperty({
    example: true,
    description: 'View permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canView?: boolean;

  @ApiProperty({
    example: false,
    description: 'Create permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @ApiProperty({
    example: false,
    description: 'Edit permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiProperty({
    example: false,
    description: 'Delete permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;
}
