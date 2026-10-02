import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkPermissionEntryDto {
  @ApiProperty({ example: 1, description: 'Menu ID' })
  @IsNumber()
  menuId: number;

  @ApiProperty({ example: true, description: 'View permission', required: false })
  @IsBoolean()
  @IsOptional()
  canView?: boolean;

  @ApiProperty({ example: false, description: 'Create permission', required: false })
  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @ApiProperty({ example: false, description: 'Edit permission', required: false })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiProperty({ example: false, description: 'Delete permission', required: false })
  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;
}

export class BulkSavePermissionsDto {
  @ApiProperty({ type: [BulkPermissionEntryDto], description: 'Permission rows to upsert' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkPermissionEntryDto)
  permissions: BulkPermissionEntryDto[];
}
