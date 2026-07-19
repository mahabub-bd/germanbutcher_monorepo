import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({
    example: 'Tech Distributors Inc.',
    description: 'Name of the supplier',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'contact@techdist.com',
    description: 'Primary contact email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+1 (555) 123-4567',
    description: 'Primary contact phone',
  })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Business Rd, Tech City',
    description: 'Physical address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the supplier is active',
  })
  @IsOptional()
  isActive?: boolean;
}
