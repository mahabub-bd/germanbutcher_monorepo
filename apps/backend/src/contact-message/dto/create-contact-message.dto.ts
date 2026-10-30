import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { ContactSource } from 'src/common/enums';

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

  @ApiPropertyOptional({
    example: 'ORD123456',
    description: 'Order number this inquiry is about',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  orderReference?: string;

  @ApiPropertyOptional({ enum: ContactSource, default: ContactSource.WEBSITE })
  @IsOptional()
  @IsEnum(ContactSource)
  source?: ContactSource;

  @ApiPropertyOptional({
    example: 12,
    description:
      'Customer account to link the ticket to. Only accepted from staff callers.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;
}
