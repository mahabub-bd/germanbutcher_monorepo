
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({
    description: 'ID of user updating this role',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  updatedBy?: number;
}
