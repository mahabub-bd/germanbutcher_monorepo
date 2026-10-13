import { ContactStatus } from 'src/common/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendContactResponseDto {
  @IsString()
  @IsNotEmpty()
  responseNotes: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  contactStatus?: ContactStatus;
}
