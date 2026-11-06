// src/auth/dto/update-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from 'src/common/enums';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe Updated',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'updated@example.com',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    required: false,
  })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'The password of the user (min 8 characters)',
    example: 'NewStrongPassword123!',
    minLength: 8,
    maxLength: 100,
    writeOnly: true,
    required: false,
  })
  @IsString()
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
    description: 'OTP for verification',
    example: '123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  otp?: string;

  @ApiProperty({
    description: 'OTP expiration timestamp',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  otpExpiresAt?: Date;

  @ApiProperty({
    description: 'Whether the user account is verified',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description: 'ID of the uploaded profile photo attachment',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  profilePhotoId?: string;

  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsEnum(Gender, { message: 'Gender must be male, female or other' })
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    description: 'The date of birth of the user (ISO 8601 date)',
    example: '1995-08-20',
    required: false,
  })
  @IsISO8601({}, { message: 'Date of birth must be a valid date' })
  @IsOptional()
  dateOfBirth?: string;
}
