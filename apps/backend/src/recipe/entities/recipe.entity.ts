import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Category } from 'src/category/entities/category.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the recipe',
  })
  id: number;

  @Column()
  @ApiProperty({
    example: 'Spaghetti Carbonara',
    description: 'Title of the recipe',
  })
  title: string;

  @Column('text')
  @ApiProperty({
    example: 'Cook pasta, fry bacon, mix with eggs and cheese...',
    description: 'Detailed instructions for the recipe',
  })
  details: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'Calories: 500, Protein: 20g',
    description: 'Nutritional information about the recipe',
  })
  nutrition_details: string | null;

  @ManyToOne(() => Attachment, { nullable: true, eager: true })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'Recipe image attachment',
  })
  attachment?: Attachment;

  @Column({ default: true })
  @ApiProperty({
    example: true,
    description: 'Whether the recipe is published or not',
    default: true,
  })
  isPublished: boolean;

  @ManyToOne(() => Category, (category) => category.recipes, {
    nullable: true,
  })
  @ApiPropertyOptional({
    type: () => Category,
    description: 'Category the recipe belongs to',
  })
  category: Category;

  @CreateDateColumn()
  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({ type: () => User, description: 'User who created the recipe' })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated the recipe',
  })
  updatedBy: User;
}
