import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactMessage } from './contact-message.entity';

/** Who wrote a thread reply on a support ticket. */
export type ReplySenderType = 'customer' | 'admin';

@Entity('contact_message_replies')
@Index(['contactMessageId', 'createdAt'])
export class ContactMessageReply {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ContactMessage })
  @ManyToOne(() => ContactMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contact_message_id' })
  contactMessage: ContactMessage;

  @Column({ name: 'contact_message_id', type: 'int' })
  contactMessageId: number;

  @ApiProperty({ example: 'Thanks, that solved it!' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ enum: ['customer', 'admin'] })
  @Column({ type: 'varchar', length: 10 })
  senderType: ReplySenderType;

  /** Set when a logged-in customer wrote the reply; null for admin replies. */
  @Column({ type: 'int', nullable: true })
  customerId: number | null;

  /** Set when an admin wrote the reply; null for customer replies. */
  @Column({ type: 'int', nullable: true })
  adminId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
