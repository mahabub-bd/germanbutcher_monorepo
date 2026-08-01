// src/auth/dto/mobile-login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class MobileLoginDto {
  @ApiProperty({ 
    description: 'International mobile number with country code',
    example: '+8801712345678'
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  mobileNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'International mobile number with country code',
    example: '+8801712345678'
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456'
  })
  @Length(6, 6)
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
    description: 'User name (optional - for new users to set their name)',
    example: 'John Doe',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;
}