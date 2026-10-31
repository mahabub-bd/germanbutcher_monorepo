import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

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
    divisions: {
      name: string;
      enabled: boolean;
      /** Division-wide delivery time inherited by cities/areas; null = none. */
      deliveryTime?: string | null;
    }[];
    cities: {
      division: string;
      name: string;
      enabled: boolean;
      /** City-wide delivery charge (৳) inherited by its areas; no city value = shipping method cost. */
      deliveryCharge?: number | null;
      /** City-wide minimum order amount (৳) inherited by its areas; null = no minimum. */
      minOrderAmount?: number | null;
      /** City-wide delivery time inherited by its areas; null = division/none. */
      deliveryTime?: string | null;
    }[];
    areas: {
      city: string;
      name: string;
      enabled: boolean;
      /** Area-specific delivery charge (৳); null = use the shipping method's cost. */
      deliveryCharge?: number | null;
      /** Minimum order subtotal (৳) for this area; null = no area minimum. */
      minOrderAmount?: number | null;
      /** Area-specific delivery time; null = inherit the city's, then the division's. */
      deliveryTime?: string | null;
    }[];
  } | null;

  @ApiPropertyOptional({
    example: 20000,
    description: 'Total delivered spend (৳) at which a customer becomes VIP',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  vipMinSpent?: number | null;

  @ApiPropertyOptional({
    example: 10,
    description: 'Delivered order count at which a customer becomes VIP',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  vipMinOrders?: number | null;

  @ApiPropertyOptional({
    example: 90,
    description: 'Days without an order before a buyer becomes At Risk',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  atRiskDays?: number | null;

  @ApiPropertyOptional({
    example: 30,
    description: 'Days since signup a customer counts as New',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  newDays?: number | null;
}
