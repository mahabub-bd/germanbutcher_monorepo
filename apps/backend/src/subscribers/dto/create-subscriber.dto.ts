// src/subscribers/dto/create-subscriber.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateSubscriberDto {
  @ApiProperty({
    description: 'The email of the subscriber',
    example: 'subscriber@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
