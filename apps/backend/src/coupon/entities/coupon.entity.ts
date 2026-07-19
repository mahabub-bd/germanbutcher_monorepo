import { DiscountType } from 'src/common/enums';
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

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
  })
  minOrderAmount: number;

  @Column({ default: 0 })
  timesUsed: number;

  @Column({ nullable: true })
  maxUsage: number;

  @Column()
  validFrom: Date;

  @Column()
  validUntil: Date;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Product, { nullable: true, cascade: true })
  @JoinTable({
    name: 'coupon_excluded_products',
    joinColumn: { name: 'couponId' },
    inverseJoinColumn: { name: 'productId' },
  })
  excludedItems?: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
