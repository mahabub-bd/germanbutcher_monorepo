import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from 'src/category/entities/category.entity';
import { Product } from 'src/product/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A free delivery campaign: when an order matches its conditions, the
 * shipping charge is waived entirely. Day/time conditions are evaluated in
 * the Asia/Dhaka timezone.
 */
@Entity()
export class FreeDeliveryCampaign {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 'Meat Friday Night', description: 'Campaign name' })
  name: string;

  @Column({ default: true })
  @ApiProperty({ example: true, description: 'Whether the campaign is active' })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({
    example: '2026-09-28T00:00:00.000Z',
    description: 'Campaign start (exact moment); null = no start limit',
  })
  validFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({
    example: '2026-10-15T17:59:00.000Z',
    description: 'Campaign end (exact moment); null = no end limit',
  })
  validUntil: Date | null;

  @Column({ type: 'json', nullable: true })
  @ApiPropertyOptional({
    example: [5, 6],
    description:
      'Days of week the campaign runs (0=Sunday..6=Saturday); null/[] = every day',
  })
  daysOfWeek: number[] | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  @ApiPropertyOptional({ example: '18:00', description: 'Start time (HH:mm, Asia/Dhaka)' })
  startTime: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  @ApiPropertyOptional({ example: '22:00', description: 'End time (HH:mm, Asia/Dhaka, exclusive)' })
  endTime: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ example: 500, description: 'Minimum order subtotal (0 = no minimum)' })
  minOrderAmount: number;

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({ example: 2, description: 'Minimum total item quantity; null = no limit' })
  minQuantity: number | null;

  @Column({ default: false })
  @ApiProperty({
    example: false,
    description: 'Only customers with zero previous orders qualify; guests never match',
  })
  newCustomersOnly: boolean;

  @Column({ default: 0 })
  @ApiProperty({ example: 0, description: 'How many orders used this campaign' })
  usageCount: number;

  @ManyToMany(() => Product, { nullable: true, cascade: true })
  @JoinTable({
    name: 'free_delivery_campaign_products',
    joinColumn: { name: 'campaignId' },
    inverseJoinColumn: { name: 'productId' },
  })
  @ApiPropertyOptional({ type: () => Product, isArray: true })
  products?: Product[];

  @ManyToMany(() => Category, { nullable: true, cascade: true })
  @JoinTable({
    name: 'free_delivery_campaign_categories',
    joinColumn: { name: 'campaignId' },
    inverseJoinColumn: { name: 'categoryId' },
  })
  @ApiPropertyOptional({ type: () => Category, isArray: true })
  categories?: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
