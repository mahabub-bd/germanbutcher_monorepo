// src/menu-permission/dto/create-menu-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class CreateMenuPermissionDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  @IsNumber()
  roleId: number;

  @ApiProperty({ example: 1, description: 'Menu ID' })
  @IsNumber()
  menuId: number;

  @ApiProperty({
    example: true,
    description: 'View permission',
    required: false,
  })
  @IsBoolean()
  canView?: boolean;

  @ApiProperty({
    example: false,
    description: 'Create permission',
    required: false,
  })
  @IsBoolean()
  canCreate?: boolean;

  @ApiProperty({
    example: false,
    description: 'Edit permission',
    required: false,
  })
  @IsBoolean()
  canEdit?: boolean;

  @ApiProperty({
    example: false,
    description: 'Delete permission',
    required: false,
  })
  @IsBoolean()
  canDelete?: boolean;
}

// src/menu-permission/dto/update-menu-permission.dto.ts
import { IsOptional } from 'class-validator';

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
