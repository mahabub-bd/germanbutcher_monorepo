import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'The unique identifier of the role',
    example: 1,
  })
  id: number;

  @Column({ length: 100, unique: true })
  @ApiProperty({
    description: 'The name of the role',
    example: 'admin',
    maxLength: 100,
  })
  rolename: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    description: 'Description of the role',
    example: 'Administrator with full access rights',
  })
  description: string;

  @Column({ default: true })
  @ApiProperty({
    description: 'Whether the role is active',
    example: true,
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
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiPropertyOptional({
    description: 'User who created the role',
    type: () => User,
  })
  createdBy: User;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiPropertyOptional({
    description: 'User who last updated the role',
    type: () => User,
  })
  updatedBy: User;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
