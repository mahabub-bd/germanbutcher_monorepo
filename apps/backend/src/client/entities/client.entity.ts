import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';

@Entity('client')
export class Client {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the client' })
  Id: number;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: 'Name of the client' })
  name: string;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Order of client' })
  order: number;

  @ManyToOne(() => Attachment, { eager: true })
  @JoinColumn()
  @ApiProperty({
    type: () => Attachment,
    description: 'Image attachment for the client',
  })
  Image: Attachment;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ description: 'Indicates whether the client is active' })
  isActive: boolean;

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
}
