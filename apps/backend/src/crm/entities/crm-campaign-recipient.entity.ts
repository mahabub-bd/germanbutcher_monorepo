import { ApiProperty } from '@nestjs/swagger';
import { CrmCampaignRecipientStatus } from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CrmCampaign } from './crm-campaign.entity';

/**
 * One customer's delivery row for a campaign. Contact details are snapshotted
 * at send time so the log stays truthful even if the customer edits their
 * profile later.
 */
@Entity('crm_campaign_recipient')
@Index(['campaign', 'user'])
export class CrmCampaignRecipient {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier' })
  id: number;

  @ManyToOne(() => CrmCampaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  @ApiProperty({ type: () => CrmCampaign, description: 'The campaign' })
  campaign: CrmCampaign;

  @Index()
  @Column({ name: 'campaignId', type: 'int' })
  @ApiProperty({ description: 'Campaign ID' })
  campaignId: number;

  /** Recipient customer, if the row came from a real user. */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  @ApiProperty({ type: () => User, nullable: true })
  user?: User | null;

  @Column({ name: 'userId', type: 'int', nullable: true })
  @ApiProperty({ description: 'Customer (user) ID', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  @ApiProperty({ description: 'Customer name snapshot', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  @ApiProperty({ description: 'Phone snapshot', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  @ApiProperty({ description: 'Email snapshot', nullable: true })
  email: string | null;

  @ApiProperty({ enum: CrmCampaignRecipientStatus })
  @Index()
  @Column({
    type: 'enum',
    enum: CrmCampaignRecipientStatus,
    default: CrmCampaignRecipientStatus.PENDING,
  })
  status: CrmCampaignRecipientStatus;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Failure reason, if any', nullable: true })
  error: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'When the message went out', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ description: 'Creation timestamp', readOnly: true })
  createdAt: Date;
}
