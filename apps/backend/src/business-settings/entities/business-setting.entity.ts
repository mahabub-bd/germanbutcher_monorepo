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
