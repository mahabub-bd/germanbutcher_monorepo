import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';

@Entity('testimonials')
export class Testimonial {
  @ApiProperty({ example: 1, description: 'Unique identifier for the testimonial' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Sarah Johnson', description: 'Customer name' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'Loyal Customer', description: 'Customer role or title' })
  @Column({ type: 'varchar', length: 100 })
  role: string;

  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @Column({ type: 'int', default: 5 })
  rating: number;

  @ApiProperty({ 
    example: 'I\'ve been shopping here for years and the quality never disappoints. The customer service is exceptional and delivery is always on time!',
    description: 'Customer testimonial text' 
  })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ 
    example: true, 
    description: 'Whether the testimonial is published/visible to public' 
  })
  @Column({ type: 'boolean', default: false })
  isPublish: boolean;

  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'Customer avatar image attachment'
  })
  @ManyToOne(() => Attachment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'attachment_id' })
  attachment?: Attachment;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp when the testimonial was created' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp when the testimonial was last updated' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
