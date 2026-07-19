import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class TokensDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    required: true,
  })
  @IsJWT({ message: 'Invalid JWT access token format' })
  @IsNotEmpty({ message: 'Access token cannot be empty' })
  @IsString({ message: 'Access token must be a string' })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RnlQDtz_LX118-NygYI',
    required: true,
    writeOnly: true, // Prevents refresh token from being exposed in responses
  })
  @IsJWT({ message: 'Invalid JWT refresh token format' })
  @IsNotEmpty({ message: 'Refresh token cannot be empty' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken: string;
}
