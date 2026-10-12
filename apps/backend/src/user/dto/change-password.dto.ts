import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The current password of the authenticated user',
    example: 'OldStrongPassword123!',
  })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({
    description: 'The new password (min 8 characters)',
    example: 'NewStrongPassword123!',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}
