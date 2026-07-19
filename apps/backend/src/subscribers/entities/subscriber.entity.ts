// src/subscribers/subscriber.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Subscriber {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'The unique identifier of the subscriber',
    type: Number,
  })
  id: number;

  @Column({ unique: true })
  @ApiProperty({
    description: 'The email of the subscriber',
    type: String,
  })
  email: string;

  @CreateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp',
    readOnly: true,
  })
  createdAt: Date;
}
