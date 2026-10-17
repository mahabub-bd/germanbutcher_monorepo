import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BogoCampaign } from 'src/bogo-campaigns/entities/bogo-campaign.entity';
import { Order } from 'src/order/entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class BogoUsageLog {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ type: () => BogoCampaign })
  @ManyToOne(() => BogoCampaign)
  @JoinColumn()
  campaign: BogoCampaign;

  @ApiProperty({
    example: 'Weekend BOGO',
    description: 'Campaign name snapshot at usage time',
  })
  @Column()
  campaignName: string;

  @ApiPropertyOptional({ type: () => Order })
  @ManyToOne(() => Order)
  @JoinColumn()
  order: Order;

  @ApiPropertyOptional({ type: () => User })
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ApiProperty({
    example: 120,
    description: 'Total BOGO discount this campaign gave on the order',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({
    example: 1,
    description: 'Units given free by this campaign on the order',
  })
  @Column({ default: 0 })
  freeUnits: number;

  @ApiProperty({
    example: 916.0,
    description: 'Order total value',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  orderTotal: number;

  @ApiProperty({
    example: '2026-10-10T18:30:00.000Z',
    description: 'When the campaign was used',
  })
  @CreateDateColumn()
  createdAt: Date;
}
