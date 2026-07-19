// src/addresses/address.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { AddressType } from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  area: string;

  @Column({ nullable: true })
  division: string;

  @Column({ nullable: true })
  city: string;

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.SHIPPING,
  })
  type: AddressType;

  @Column({ default: false })
  isDefault: boolean;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ type: Number })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;
}

// Address