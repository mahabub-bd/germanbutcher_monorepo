// src/auth/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'The password of the user (min 8 characters)',
    example: 'StrongPassword123!',
    minLength: 8,
    maxLength: 100,
    writeOnly: true,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Mobile number of the user',
    example: '+8801712345678',
    required: false,
  })
  @IsPhoneNumber()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({
    description: 'Whether the user account is verified',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description: 'The role assigned to the user',
    example: 3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  roleId?: Number;
}
