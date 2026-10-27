import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({
    example: false,
    description:
      'When true (and within the optional schedule window), the storefront shows a maintenance page',
  })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({
    example: 'We are upgrading our store — back soon!',
    description: 'Custom message displayed on the maintenance page; null clears it',
  })
  @IsOptional()
  @IsString()
  maintenanceMessage?: string;

  @ApiPropertyOptional({
    example: '2026-10-16T18:00:00.000Z',
    description:
      'Maintenance window start (ISO datetime); before this time the storefront stays online',
  })
  @IsOptional()
  @IsString()
  maintenanceStartsAt?: string;

  @ApiPropertyOptional({
    example: '2026-10-16T20:00:00.000Z',
    description:
      'Maintenance window end (ISO datetime); after this time the storefront comes back online',
  })
  @IsOptional()
  @IsString()
  maintenanceEndsAt?: string;

  @ApiPropertyOptional({
    example: {
      divisions: [{ name: 'Dhaka', enabled: true }],
      cities: [{ division: 'Dhaka', name: 'Dhaka', enabled: true }],
      areas: [{ city: 'Dhaka', name: 'Badda', enabled: true }],
    },
    description:
      'Delivery coverage: plain lists of divisions/cities/areas seeded from the BD dataset and fully editable (add/rename/delete/enable).',
  })
  @IsOptional()
  @IsObject()
  deliveryCoverage?: {
    divisions: { name: string; enabled: boolean }[];
    cities: { division: string; name: string; enabled: boolean }[];
    areas: { city: string; name: string; enabled: boolean }[];
  } | null;
}
