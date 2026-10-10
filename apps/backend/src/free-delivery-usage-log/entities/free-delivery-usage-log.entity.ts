import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FreeDeliveryCampaign } from 'src/free-delivery-campaigns/entities/free-delivery-campaign.entity';
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
export class FreeDeliveryUsageLog {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ type: () => FreeDeliveryCampaign })
  @ManyToOne(() => FreeDeliveryCampaign)
  @JoinColumn()
  campaign: FreeDeliveryCampaign;

  @ApiProperty({
    example: 'Meat Friday Night',
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
    example: 60,
    description: 'Shipping cost waived by this campaign',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingWaived: number;

  @ApiProperty({
    example: 1250.0,
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
