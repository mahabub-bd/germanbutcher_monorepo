import { PartialType } from '@nestjs/swagger';
import { ActionTaken, ContactStatus } from 'src/common/enums';
import { CreateContactMessageDto } from './create-contact-message.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateContactMessageDto extends PartialType(CreateContactMessageDto) {
  @IsOptional()
  @IsEnum(ContactStatus)
  contactStatus?: ContactStatus;

  @IsOptional()
  @IsEnum(ActionTaken)
  actionTaken?: ActionTaken;

  @IsOptional()
  @IsString()
  responseNotes?: string;
}
