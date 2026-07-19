import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { User } from 'src/user/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BannerPosition {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  SIDEBAR = 'sidebar',
}

export enum BannerType {
  MAIN = 'main',
  PROMOTIONAL = 'promotional',
  FEATURED = 'featured',
}

@Entity()
@Index(['isActive'])
@Index(['position'])
@Index(['type'])
@Index(['displayOrder'])
@Index(['isActive', 'position'])
@Index(['isActive', 'displayOrder'])
export class Banner extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier for the banner',
  })
  id: number;

  @Column()
  @ApiProperty({
    example: 'Summer Sale 2023',
    description: 'Title of the banner',
  })
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example: 'Get 50% off on all summer collections',
    description: 'Subtitle or description of the banner',
  })
  description: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: '/summer-sale',
    description: 'URL to redirect when banner is clicked',
  })
  targetUrl: string;

  @ManyToOne(() => Attachment, { eager: true })
  @JoinColumn()
  @ApiProperty({
    type: () => Attachment,
    description: 'Image attachment for the banner',
  })
  image: Attachment;

  @Column({
    type: 'enum',
    enum: BannerPosition,
    default: BannerPosition.TOP,
  })
  @ApiProperty({
    enum: BannerPosition,
    example: BannerPosition.TOP,
    description: 'Position where banner should be displayed',
  })
  position: BannerPosition;

  @Column({
    type: 'enum',
    enum: BannerType,
    default: BannerType.MAIN,
  })
  @ApiProperty({
    enum: BannerType,
    example: BannerType.MAIN,
    description: 'Type of banner',
  })
  type: BannerType;

  @Column({ default: true })
  @ApiProperty({
    example: true,
    description: 'Whether the banner is active',
    default: true,
  })
  isActive: boolean;

 

  @Column({ default: 0 })
  @ApiProperty({
    example: 0,
    description: 'Display order/priority of the banner',
    default: 0,
  })
  displayOrder: number;

  @CreateDateColumn()
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
    description: 'User who created this banner',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this banner',
  })
  updatedBy: User;
}
