import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Brand } from 'src/brand/entities/brand.entity';
import { Category } from 'src/category/entities/category.entity';
import { DiscountType } from 'src/common/enums';
import { Gallery } from 'src/gallery/entities/gallery.entity';
import { OrderItem } from 'src/order/entities/order-item.entity';
import { PurchaseItem } from 'src/purchase/entities/purchase-item.entity';
import { Supplier } from 'src/supplier/entities/supplier.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { User } from 'src/user/entities/user.entity';

import { slugify } from 'transliteration';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['slug'])
@Index(['isActive'])
@Index(['isFeatured'])
@Index(['saleCount'])
@Index(['sellingPrice'])
@Index(['createdAt'])
@Index(['isActive', 'isFeatured'])
@Index(['discountType', 'discountValue', 'discountStartDate', 'discountEndDate'])
@ApiTags('Products')
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'The unique identifier of the product',
    readOnly: true,
  })
  id: number;

  @Column()
  @ApiProperty({
    description: 'Name of the product',
    required: true,
    maxLength: 255,
  })
  name: string;

  @Column({ nullable: true, unique: true })
  @ApiProperty({
    description: 'URL-friendly slug for the brand',
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  @Matches(/^[a-z0-9\-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers and hyphens',
  })
  slug: string;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (!this.slug && this.name) {
      this.slug = slugify(this.name, { lowercase: true, separator: '-' });
    } else if (this.slug) {
      this.slug = slugify(this.slug, { lowercase: true, separator: '-' });
    }
  }

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example: 'Noise cancelling Bluetooth headphones with 30hr battery life',
    description: 'Detailed description of the product',
  })
  description?: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example:
      'Product includes noise cancellation, Bluetooth connectivity, and long battery life.',
    description: 'Additional content or details about the product',
  })
  productDetails?: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: 199.99,
    description: 'Selling price of the product',
    type: 'number',
    format: 'decimal',
    minimum: 0.01,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  sellingPrice: number;

  @Column({ nullable: true })
  @ApiProperty({
    example: 149.99,
    description: 'Current purchase price from supplier',
    type: 'number',
    format: 'decimal',
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @Column({ default: 0 })
  @ApiProperty({
    example: 50,
    description: 'Available quantity in stock',
    default: 0,
    minimum: 0,
  })
  stock: number;

  @Column({ default: 0 })
  @ApiProperty({
    example: 10,
    description: 'The number of times this product has been sold',
  })
  saleCount: number;

  @ManyToOne(() => Unit, (unit) => unit.products, { eager: true })
  @ApiProperty({
    type: () => Unit,
    description: 'The unit of measurement for this product',
  })
  unit: Unit;

  @Column({ unique: true, length: 50, nullable: true })
  @ApiProperty({
    example: 'PRD-ABC123',
    description: 'Unique SKU for the product',
    maxLength: 50,
  })
  productSku: string;

  @BeforeInsert()
  generateSku() {
    if (!this.productSku) {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const prefix = 'PRD-';
      this.productSku = prefix + randomPart;
    }
  }

  @ManyToOne(() => Attachment, (attachment) => attachment.products)
  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'Product image attachment',
  })
  attachment?: Attachment;

  @OneToOne(() => Gallery, { nullable: true, eager: false })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Gallery,
    description: 'Product gallery',
  })
  gallery?: Gallery;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @Column({ default: true })
  @ApiProperty({
    example: true,
    description: 'Whether the product is active and visible',
    default: true,
  })
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty({
    example: true,
    description: 'Whether the product is featured',
    default: false,
  })
  isFeatured: boolean;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  @ApiProperty({
    type: () => Category,
    description: 'The category this product belongs to',
  })
  category: Category;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @ApiProperty({
    type: () => Brand,
    description: 'The brand this product belongs to',
  })
  brand: Brand;

  @ManyToOne(() => Supplier, (supplier) => supplier.products, { eager: true })
  @ApiProperty({
    type: () => Supplier,
    description: 'Primary supplier for this product',
  })
  supplier: Supplier;

  @OneToMany(() => PurchaseItem, (item) => item.product)
  @ApiPropertyOptional({
    type: () => PurchaseItem,
    isArray: true,
    description: 'Purchase history items',
  })
  purchaseItems?: PurchaseItem[];

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  @ApiProperty({
    example: 9999.99,
    description: 'Total inventory value based on selling price',
    type: 'number',
    default: 0.0,
  })
  totalValueBySalePrice: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  @ApiProperty({
    example: 7499.95,
    description: 'Total inventory value based on purchase price',
    type: 'number',
    default: 0.0,
  })
  totalValueByPurchasePrice: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp',
    readOnly: true,
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update timestamp',
    readOnly: true,
  })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who created this product',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this product',
  })
  updatedBy: User;

  @Column({ type: 'enum', enum: DiscountType, nullable: true })
  @ApiPropertyOptional({
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    description: 'Type of discount applied',
  })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    nullable: true,
  })
  @ApiPropertyOptional({
    example: 2.5,
    description: 'Product weight in kilograms',
    type: 'number',
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  weight?: number;
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  @ApiPropertyOptional({
    example: 15.5,
    description: 'Discount value (percentage or fixed amount)',
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @ValidateIf((o) => o.discountType)
  discountValue?: number;

  @Column({ type: 'timestamp', nullable: true })
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Discount start date',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  discountStartDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Discount end date',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ValidateIf((o) => o.discountStartDate)
  discountEndDate?: Date;

  @ApiProperty({
    example: 169.99,
    description: 'Calculated price after discount',
    type: 'number',
    readOnly: true,
  })
  get salePrice(): number {
    if (!this.isDiscountActive) return this.sellingPrice;

    if (this.discountType === DiscountType.PERCENTAGE) {
      return Number(
        (this.sellingPrice * (1 - this.discountValue / 100)).toFixed(2),
      );
    }

    if (this.discountType === DiscountType.FIXED) {
      return Math.max(
        0,
        Number((this.sellingPrice - this.discountValue).toFixed(2)),
      );
    }

    return this.sellingPrice;
  }

  @ApiProperty({
    example: true,
    description: 'Whether the discount is currently active',
    readOnly: true,
  })
  get isDiscountActive(): boolean {
    if (!this.discountType || !this.discountValue) return false;

    const now = new Date();
    const validDate =
      (!this.discountStartDate || now >= this.discountStartDate) &&
      (!this.discountEndDate || now <= this.discountEndDate);

    return validDate && this.discountValue > 0;
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateDiscount() {
    if (this.discountType && !this.discountValue) {
      throw new Error('Discount value is required when discount type is set');
    }

    if (
      this.discountEndDate &&
      this.discountStartDate &&
      this.discountEndDate < this.discountStartDate
    ) {
      throw new Error('Discount end date cannot be before start date');
    }

    if (
      this.discountType === DiscountType.PERCENTAGE &&
      this.discountValue > 100
    ) {
      throw new Error('Percentage discount cannot exceed 100%');
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotalValues() {
    // Only calculate if we have the necessary fields
    // This prevents NaN errors during partial updates
    if (this.stock === null || this.stock === undefined) {
      this.stock = 0;
    }

    // Ensure stock is a valid number
    const stock = Number(this.stock) || 0;

    // Get effective price with fallback to 0
    const sellingPrice = Number(this.sellingPrice) || 0;
    const purchasePrice = Number(this.purchasePrice) || 0;

    const effectivePrice = this.isDiscountActive
      ? (Number(this.salePrice) || sellingPrice)
      : sellingPrice;

    this.totalValueBySalePrice = Number(
      (stock * effectivePrice).toFixed(2),
    );

    this.totalValueByPurchasePrice = Number(
      (stock * purchasePrice).toFixed(2),
    );
  }

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    default: [],
  })
  @ApiPropertyOptional({

    description: 'Tags for categorizing and filtering products',
    type: [String],
  })
  @IsOptional()
  tags?: string[];
}
