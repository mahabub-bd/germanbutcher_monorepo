import { ApiProperty } from '@nestjs/swagger';
import {
  CrmCampaignChannel,
  CrmCampaignStatus,
  CrmSegment,
} from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A bulk outreach blast (SMS or email) to one customer segment.
 * Recipients and their per-customer delivery status live in
 * crm_campaign_recipient.
 */
@Entity('crm_campaign')
export class CrmCampaign {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the campaign' })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  @ApiProperty({ description: 'Campaign name', maxLength: 150 })
  name: string;

  @ApiProperty({ enum: CrmCampaignChannel })
  @Column({ type: 'enum', enum: CrmCampaignChannel })
  channel: CrmCampaignChannel;

  /** Which auto-computed RFM segment receives the campaign. */
  @ApiProperty({ enum: CrmSegment, nullable: true })
  @Column({ type: 'enum', enum: CrmSegment, nullable: true })
  segment: CrmSegment | null;

  /** Email subject — email campaigns only. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  @ApiProperty({ description: 'Email subject (email campaigns only)', nullable: true })
  subject: string | null;

  /** SMS text or email body (plain text, wrapped in a template on send). */
  @Column({ type: 'text' })
  @ApiProperty({ description: 'Message body' })
  message: string;

  @ApiProperty({ enum: CrmCampaignStatus })
  @Index()
  @Column({ type: 'enum', enum: CrmCampaignStatus, default: CrmCampaignStatus.DRAFT })
  status: CrmCampaignStatus;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Resolved recipients at send time' })
  totalRecipients: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Successfully delivered' })
  sentCount: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Failed or skipped (missing phone/email)' })
  failedCount: number;

  /** The admin who created the campaign. */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({ type: () => User, description: 'Admin who created it', nullable: true })
  createdBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'When sending finished', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ description: 'Creation timestamp', readOnly: true })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp', readOnly: true })
  updatedAt: Date;
}
