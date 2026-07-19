import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Product } from 'src/product/entities/product.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';
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
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['slug'])
@Index(['isActive'])
@Index(['parentId'])
@Index(['order'])
@Index(['isMainCategory'])
@Index(['parentId', 'isActive'])
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: 'Unique identifier', readOnly: true })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ example: 'Electronics', description: 'Category name' })
  name: string;

  @Column({ nullable: true, unique: true })
  @ApiProperty({ example: 'electronics', description: 'URL-friendly slug' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  @Matches(/^[a-z0-9\-]+$/, { message: 'Invalid slug format' })
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

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Order of category' })
  order: number;


  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'Electronic devices',
    description: 'Category description',
  })
  description: string;

  @ManyToOne(() => Attachment, { nullable: true, eager: true })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'Category image',
  })
  attachment?: Attachment;

  @Column({ default: true })
  @ApiProperty({ example: true, description: 'Active status', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @ApiPropertyOptional({ example: 1, description: 'Parent category ID' })
  parentId?: number;

  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  @ApiPropertyOptional({ type: () => Category })
  parent?: Category;

  @ApiProperty({
    example: true,
    description: 'Whether this is a main menu item',
    default: false,
  })
  @Column({ name: 'is_main_menu', type: 'boolean', default: false })
  isMainCategory: boolean;

  @OneToMany(() => Category, (category) => category.parent)
  @ApiPropertyOptional({ type: () => Category, isArray: true })
  children: Category[];

  @OneToMany(() => Product, (product) => product.category)
  @ApiPropertyOptional({ type: () => Product, isArray: true })
  products: Product[];

  @OneToMany(() => Recipe, (recipe) => recipe.category)
  @ApiPropertyOptional({
    type: () => Recipe,
    isArray: true,
    description: 'Recipes in this category',
  })
  recipes: Recipe[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update date',
  })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({ type: () => User, description: 'Creator user' })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({ type: () => User, description: 'Last updater user' })
  updatedBy: User;
}
