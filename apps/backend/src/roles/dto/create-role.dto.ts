// src/roles/dto/create-role.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Name of the role',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  rolename: string;

  @ApiPropertyOptional({
    description: 'Description of the role',
    example: 'Administrator role with full access',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the role is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'ID of user creating this role',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  createdBy?: number;
}

