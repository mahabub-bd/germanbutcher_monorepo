import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: true,
    pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: true,
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
  name: string;

  @ApiProperty({
    description:
      'User password (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number and 1 special char)',
    example: 'SecurePassword123!',
    required: true,
    minLength: 8,
    writeOnly: true,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character',
  })
  password: string;

  @ApiProperty({
    description: 'Mobile number of the user',
    example: '+8801712345678',
    required: true,
  })
  @IsPhoneNumber()
  @IsOptional()
  mobileNumber?: string;
}
