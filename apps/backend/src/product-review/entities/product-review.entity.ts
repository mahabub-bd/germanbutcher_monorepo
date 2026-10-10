import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_reviews')
@Index('UQ_product_review_user_product', ['user', 'product'], { unique: true })
@Index('IDX_product_review_product_approved', ['product', 'isApproved'])
export class ProductReview {
  @ApiProperty({ example: 1, description: 'Unique identifier for the review' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 5, description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @Column({ type: 'int' })
  rating: number;

  @ApiPropertyOptional({ example: 'Excellent quality', description: 'Optional short review title' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string | null;

  @ApiProperty({
    example: 'The meat was fresh and delivery was on time. Highly recommended!',
    description: 'Review comment text',
  })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({
    example: false,
    description: 'Whether the review is approved and publicly visible',
  })
  @Index()
  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the review was rejected by an admin',
  })
  @Index()
  @Column({ type: 'boolean', default: false })
  isRejected: boolean;

  @ApiProperty({ type: () => User, description: 'Customer who wrote the review' })
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ type: () => Product, description: 'Reviewed product' })
  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiPropertyOptional({
    example: 42,
    description: 'ID of the order that qualified this customer to review (audit)',
  })
  @Column({ type: 'int', nullable: true })
  orderId: number | null;

  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'Optional photo uploaded with the review',
  })
  @ManyToOne(() => Attachment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'attachment_id' })
  attachment?: Attachment | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp when the review was created' })
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp when the review was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
