import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { slugify } from 'transliteration';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Brand extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the brand',
    readOnly: true,
  })
  id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: 'Nike',
    description: 'Name of the brand',
    maxLength: 255,
  })
  name: string;

  @Column({ nullable: true, unique: true })
  @ApiProperty({
    example: 'nike-sportswear',
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

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'American multinational corporation',
    description: 'Description of the brand',
  })
  description: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'https://www.nike.com',
    description: 'Official website URL',
  })
  website: string;

  @ManyToOne(() => Attachment, { nullable: true, eager: true })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'Brand logo attachment',
  })
  attachment?: Attachment;

  @OneToMany(() => Product, (product) => product.brand)
  @ApiPropertyOptional({
    type: () => [Product],
    description: 'Products associated with this brand',
  })
  products: Product[];

  @Column({ default: true })
  @ApiProperty({
    example: true,
    description: 'Whether the brand is active',
    default: true,
  })
  isActive: boolean;

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
  @JoinColumn({ name: 'createdby' })
  @ApiProperty({
    type: () => User,
    description: 'User who created this product',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedby' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this product',
  })
  updatedBy: User;
}
