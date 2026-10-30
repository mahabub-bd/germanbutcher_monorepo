import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateContactMessageReplyDto {
  @ApiProperty({
    example: 'Thanks — here is the screenshot you asked for',
    description: 'Customer follow-up message on their own ticket',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  message: string;
}
