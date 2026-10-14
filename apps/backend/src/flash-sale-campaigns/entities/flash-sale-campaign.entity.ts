import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from 'src/common/enums/index';
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
 * A flash sale campaign: while active, selected products (directly or via
 * their category) are sold at a campaign price that always overrides the
 * product's own per-product discount (never stacked). `maxUsage` 0 means
 * unlimited; otherwise the campaign stops applying once `timesUsed` hits it.
 */
@Entity()
export class FlashSaleCampaign {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 'Eid Flash Sale', description: 'Campaign name' })
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

  @Column({ type: 'enum', enum: DiscountType })
  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    description: 'How discountValue is applied to the selling price',
  })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ example: 20, description: 'Discount amount (% or fixed ৳)' })
  discountValue: number;

  @Column({ default: 0 })
  @ApiProperty({
    example: 0,
    description: 'Maximum uses (0 = unlimited)',
  })
  maxUsage: number;

  @Column({ default: 0 })
  @ApiProperty({ example: 0, description: 'How many times this campaign was applied' })
  timesUsed: number;

  // When several active campaigns cover the same product, the lowest id
  // (created first) wins.
  @ManyToMany(() => Product, { nullable: true, cascade: true })
  @JoinTable({
    name: 'flash_sale_campaign_products',
    joinColumn: { name: 'campaignId' },
    inverseJoinColumn: { name: 'productId' },
  })
  @ApiPropertyOptional({ type: () => Product, isArray: true })
  products?: Product[];

  @ManyToMany(() => Category, { nullable: true, cascade: true })
  @JoinTable({
    name: 'flash_sale_campaign_categories',
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
