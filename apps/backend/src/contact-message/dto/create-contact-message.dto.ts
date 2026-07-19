import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the contact person',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail()
  @IsNotEmpty()
  @Length(5, 150)
  email: string;

  @ApiProperty({
    example: '+8801234567890',
    description: 'Mobile phone number',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  @Matches(/^[\+]?[0-9\s\-\(\)]+$/, { message: 'Mobile number must be valid' })
  mobile: string;

  @ApiProperty({
    example: 'I would like to inquire about your products...',
    description: 'Contact message',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 1000)
  message: string;
}
