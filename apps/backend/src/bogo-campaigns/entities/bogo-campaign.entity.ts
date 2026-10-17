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
 * A BOGO campaign: while active, for every (buyQuantity + getQuantity)
 * eligible units in an order, the getQuantity cheapest units are free.
 * Eligible units are those of the campaign's products/categories (pooled
 * across order lines); no products/categories selected = whole catalog.
 * `maxUsage` 0 means unlimited; otherwise the campaign stops applying once
 * `timesUsed` hits it.
 */
@Entity()
export class BogoCampaign {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 'Weekend BOGO', description: 'Campaign name' })
  name: string;

  @Column({ default: true })
  @ApiProperty({ example: true, description: 'Whether the campaign is active' })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({
    example: '2026-10-20T00:00:00.000Z',
    description: 'Campaign start (exact moment); null = no start limit',
  })
  validFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({
    example: '2026-10-21T23:59:00.000Z',
    description: 'Campaign end (exact moment); null = no end limit',
  })
  validUntil: Date | null;

  @Column()
  @ApiProperty({
    example: 2,
    description: 'Units a customer must buy per free group',
  })
  buyQuantity: number;

  @Column()
  @ApiProperty({
    example: 1,
    description: 'Units given free per (buyQuantity + getQuantity) group',
  })
  getQuantity: number;

  @Column({ default: 0 })
  @ApiProperty({
    example: 0,
    description: 'Maximum free groups a single order can earn (0 = unlimited)',
  })
  maxGroupsPerOrder: number;

  @Column({ default: 0 })
  @ApiProperty({
    example: 0,
    description: 'Maximum uses (0 = unlimited)',
  })
  maxUsage: number;

  @Column({ default: 0 })
  @ApiProperty({ example: 0, description: 'How many times this campaign was applied' })
  timesUsed: number;

  // When several active campaigns cover the same unit, the lowest id
  // (created first) claims it first via the shared unit ledger.
  @ManyToMany(() => Product, { nullable: true, cascade: true })
  @JoinTable({
    name: 'bogo_campaign_products',
    joinColumn: { name: 'campaignId' },
    inverseJoinColumn: { name: 'productId' },
  })
  @ApiPropertyOptional({ type: () => Product, isArray: true })
  products?: Product[];

  @ManyToMany(() => Category, { nullable: true, cascade: true })
  @JoinTable({
    name: 'bogo_campaign_categories',
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
