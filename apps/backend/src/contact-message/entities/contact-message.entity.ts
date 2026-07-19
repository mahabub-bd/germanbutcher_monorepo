import { ActionTaken, ContactStatus } from 'src/common/enums';
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

@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.PENDING,
  })
  contactStatus: ContactStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'handled_by_id' })
  handledBy: User;

  @Column({ name: 'handled_by_id', nullable: true })
  handledById: number;

  @Column({
    type: 'enum',
    enum: ActionTaken,
    nullable: true,
  })
  actionTaken: ActionTaken;

  @Column({ type: 'text', nullable: true })
  responseNotes: string;
}
