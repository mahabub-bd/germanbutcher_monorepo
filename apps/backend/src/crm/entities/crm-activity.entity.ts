import { ApiProperty } from '@nestjs/swagger';
import { CrmActivityStatus, CrmActivityType } from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Internal CRM follow-up attached to a retail customer: a free-form note,
 * a task with a due date, or a log of a call/email. The customer (user)
 * never sees these — they are for admins only.
 */
@Entity('crm_activity')
export class CrmActivity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the activity' })
  id: number;

  /** The customer this activity is about. */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @ApiProperty({ type: () => User, description: 'The customer' })
  user: User;

  @Index()
  @Column({ type: 'int' })
  @ApiProperty({ description: 'Customer (user) ID' })
  userId: number;

  /** The admin who created the activity. */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({ type: () => User, description: 'Admin who created it', nullable: true })
  createdBy?: User;

  @ApiProperty({ enum: CrmActivityType })
  @Column({ type: 'enum', enum: CrmActivityType })
  type: CrmActivityType;

  @Column({ type: 'varchar', length: 200 })
  @ApiProperty({ description: 'Short title', maxLength: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Details', nullable: true })
  description: string | null;

  /** Only meaningful for tasks. */
  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'Due date (tasks only)', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ enum: CrmActivityStatus })
  @Column({ type: 'enum', enum: CrmActivityStatus, default: CrmActivityStatus.OPEN })
  status: CrmActivityStatus;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'When the task was completed', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ description: 'Creation timestamp', readOnly: true })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp', readOnly: true })
  updatedAt: Date;
}
