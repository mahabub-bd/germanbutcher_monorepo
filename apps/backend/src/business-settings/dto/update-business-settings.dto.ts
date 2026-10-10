import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessSettingsDto {
  @ApiPropertyOptional({
    example: 'German Butcher',
    description: 'Display name of the business',
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({
    example: 'House 56/B, Road 132, Gulshan 1, Dhaka',
    description: 'Physical address of the business',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '+8809666791991',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'support@germanbutcherbd.com',
    description: 'Contact email address',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: 'admin1@germanbutcherbd.com, admin2@germanbutcherbd.com',
    description:
      'Comma-separated addresses that receive admin notifications (new orders, new reviews)',
  })
  @IsOptional()
  @IsString()
  adminNotificationEmail?: string;

  @ApiPropertyOptional({
    example: '+8801911080825',
    description: 'WhatsApp number including country code',
  })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiPropertyOptional({
    example: 'https://www.facebook.com/germanbutcherbd',
    description: 'Full URL of the Facebook page used for Messenger chat',
  })
  @IsOptional()
  @IsString()
  messengerUrl?: string;

  @ApiPropertyOptional({
    example: 'https://www.germanbutcherbd.com',
    description: 'Public website URL',
  })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({
    example: '1',
    description:
      'ID of the uploaded attachment to use as logo; empty string clears the logo',
  })
  @IsOptional()
  @IsString()
  logoId?: string;

  @ApiPropertyOptional({
    example: '2',
    description:
      'ID of the uploaded PNG attachment to use on PDF invoices; empty string clears it',
  })
  @IsOptional()
  @IsString()
  invoiceLogoId?: string;
}
