import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Brand } from 'src/brand/entities/brand.entity';
import { Category } from 'src/category/entities/category.entity';
import { Gallery } from 'src/gallery/entities/gallery.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Attachment extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: '1',
    description: 'Unique identifier ',
  })
  id: string;

  @Column()
  @ApiProperty({
    example: 'brand-logo.png',
    description: 'Stored filename with extension',
  })
  fileName: string;

  @Column()
  @ApiProperty({
    example: 'original-filename.png',
    description: 'Original filename when uploaded',
  })
  originalName: string;

  @Column()
  @ApiProperty({
    example: 'image/png',
    description: 'MIME type of the file',
  })
  mimeType: string;

  @Column({ type: 'int' })
  @ApiProperty({
    example: 1024,
    description: 'File size in bytes',
  })
  size: number;

  @Column()
  @ApiProperty({
    example: 'https://cdn.example.com/path/to/file.png',
    description: 'Publicly accessible URL',
  })
  url: string;

  @Column()
  @ApiProperty({
    example: 'brands/1/logo.png',
    description: 'Storage path/key in the bucket',
  })
  key: string;

  @OneToMany(() => Product, (product) => product.attachment)
  @ApiPropertyOptional({
    type: () => [Product],
    description: 'Brand associated with this attachment',
  })
  products: Product[];

  @OneToMany(() => Brand, (brand) => brand.attachment)
  @ApiPropertyOptional({
    type: () => [Brand],
    description: 'Brand associated with this attachment',
  })
  brands: Brand[];

  @OneToMany(() => Category, (category) => category.attachment)
  @ApiPropertyOptional({
    type: () => [Category],
    description: 'Brand associated with this attachment',
  })
  category: Category[];

  @OneToMany(() => User, (user) => user.profilePhoto)
  @ApiPropertyOptional({
    type: () => [User],
    description: 'Users who use this as their profile photo',
  })
  userProfilePhotos: User[];

  @ManyToOne(() => Gallery, (gallery) => gallery.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gallery_id' })
  gallery: Gallery;

  @CreateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:30:00Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:35:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
