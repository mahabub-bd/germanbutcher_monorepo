import { IsNotEmpty, IsString } from 'class-validator';

export class SendContactResponseDto {
  @IsString()
  @IsNotEmpty()
  responseNotes: string;
}
