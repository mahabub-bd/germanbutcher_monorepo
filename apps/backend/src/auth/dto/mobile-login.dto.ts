// src/auth/dto/mobile-login.dto.ts
import { IsNotEmpty, IsPhoneNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}