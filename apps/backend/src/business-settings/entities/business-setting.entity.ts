import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class BusinessSetting {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier (always 1 — singleton row)',
  })
  id: number;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'German Butcher',
    description: 'Display name of the business',
  })
  businessName: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example: 'House 56/B, Road 132, Gulshan 1, Dhaka',
    description: 'Physical address of the business',
  })
  address: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: '+8809666791991',
    description: 'Contact phone number',
  })
  phone: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'support@germanbutcherbd.com',
    description: 'Contact email address',
  })
  email: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'admin1@germanbutcherbd.com, admin2@germanbutcherbd.com',
    description:
      'Comma-separated list of addresses that receive admin notifications (new orders, new reviews)',
  })
  adminNotificationEmail: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: '+8801911080825',
    description: 'WhatsApp number including country code',
  })
  whatsappNumber: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'https://www.facebook.com/germanbutcherbd',
    description: 'Full URL of the Facebook page used for Messenger chat',
  })
  messengerUrl: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'https://www.germanbutcherbd.com',
    description: 'Public website URL',
  })
  websiteUrl: string;

  @Column({ default: false })
  @ApiPropertyOptional({
    example: false,
    description:
      'When true (and within the optional schedule window), the storefront shows a maintenance page',
  })
  maintenanceMode: boolean;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example: 'We are upgrading our store — back soon!',
    description: 'Custom message displayed on the maintenance page',
  })
  maintenanceMessage: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({
    example: '2026-10-16T18:00:00.000Z',
    description:
      'Maintenance window start; before this time the storefront stays online',
  })
  maintenanceStartsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({
    example: '2026-10-16T20:00:00.000Z',
    description:
      'Maintenance window end; after this time the storefront comes back online',
  })
  maintenanceEndsAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({
    example: {
      divisions: [{ name: 'Dhaka', enabled: true }],
      cities: [{ division: 'Dhaka', name: 'Dhaka', enabled: true }],
      areas: [{ city: 'Dhaka', name: 'Badda', enabled: true }],
    },
    description:
      'Delivery coverage: plain lists of divisions/cities/areas seeded from the BD dataset and fully editable (add/rename/delete/enable).',
  })
  deliveryCoverage: {
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
      /** City-wide delivery charge (৳) inherited by its areas; null = shipping method cost. */
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

  // ── CRM segment rules ────────────────────────────────────────────────
  // All nullable — when unset the CRM code falls back to its defaults
  // (see CRM_SEGMENT_RULES in crm.service.ts).

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({
    example: 20000,
    description: 'Total delivered spend (৳) at which a customer becomes VIP',
  })
  vipMinSpent: number | null;

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({
    example: 10,
    description: 'Delivered order count at which a customer becomes VIP',
  })
  vipMinOrders: number | null;

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({
    example: 90,
    description: 'Days without an order before a buyer becomes At Risk',
  })
  atRiskDays: number | null;

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({
    example: 30,
    description: 'Days since signup a customer counts as New',
  })
  newDays: number | null;

  @ManyToOne(() => Attachment, { eager: true, nullable: true })
  @JoinColumn()
  @ApiProperty({
    type: () => Attachment,
    nullable: true,
    description: 'Business logo image',
  })
  logo: Attachment | null;

  @ManyToOne(() => Attachment, { eager: true, nullable: true })
  @JoinColumn()
  @ApiProperty({
    type: () => Attachment,
    nullable: true,
    description:
      'PNG logo used on PDF invoices and reports (react-pdf cannot render WebP)',
  })
  invoiceLogo: Attachment | null;
}
