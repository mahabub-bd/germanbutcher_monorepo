import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlashSaleCampaign } from 'src/flash-sale-campaigns/entities/flash-sale-campaign.entity';
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
export class FlashSaleUsageLog {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ type: () => FlashSaleCampaign })
  @ManyToOne(() => FlashSaleCampaign)
  @JoinColumn()
  campaign: FlashSaleCampaign;

  @ApiProperty({
    example: 'Eid Flash Sale',
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
    description: 'Total flash discount this campaign gave on the order',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

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
