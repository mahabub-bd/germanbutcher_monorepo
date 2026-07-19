import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Address } from 'src/address/entities/address.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { Order } from 'src/order/entities/order.entity';
import { Role } from 'src/roles/entities/role.entity';
import { UserActivity } from 'src/user-activity/entities/user-activity.entity';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: 1,
    type: Number,
  })
  id: number;

  @Column()
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'The email address of the user (must be unique)',
    example: 'user@example.com',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  })
  email?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'The hashed password of the user',
    example: '$argon2id$v=19$m=65536,t=3,p=4$hashsalt$hashedpassword',
    writeOnly: true,
    minLength: 8,
    maxLength: 100,
  })
  password?: string;
  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  @ApiPropertyOptional({
    description: 'The role assigned to the user',
    type: () => Role,
  })
  role?: Role;

  @Column({ nullable: true, default: 3 })
  @ApiPropertyOptional({
    description:
      'ID of the role assigned to the user (defaults to 3 for customer)',
    example: 3,
    default: 3,
  })
  roleId?: number;

  @Column({ default: false })
  @ApiProperty({
    description: 'Whether the user account is verified',
    example: false,
    type: Boolean,
  })
  isVerified: boolean;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Timestamp of last successful login',
    example: '2023-05-16T15:30:00.000Z',
    type: Date,
    required: false,
  })
  lastLoginAt: Date | null;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({
    description: 'The date when the user was created',
    example: '2023-05-15T10:00:00.000Z',
    type: Date,
    required: false,
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'The date when the user was last updated',
    example: '2023-05-16T15:30:00.000Z',
    type: Date,
    required: false,
  })
  updatedAt: Date;

  @Column({ unique: false, nullable: true })
  @ApiProperty({
    description: 'The mobile number of the user (for OTP login)',
    example: '+8801712345678',
    pattern: '^\\+[1-9]\\d{1,14}$',
    required: false,
  })
  mobileNumber: string;

  @ManyToOne(() => Attachment, { nullable: true, eager: true })
  @JoinColumn({ name: 'profilePhotoId' })
  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'User profile photo attachment',
  })
  profilePhoto?: Attachment;

  @OneToOne(() => Cart, (cart) => cart.user, {
    cascade: ['remove'],
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  cart: Cart;

  @OneToOne(() => Wishlist, (wishlist) => wishlist.user, {
    cascade: ['remove'],
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  wishlist: Wishlist;
  
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: 'Reference ID to the profile photo attachment',
    example: '1',
    type: String,
  })
  profilePhotoId?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'One-time password for mobile verification',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    required: false,
    writeOnly: true,
  })
  otp: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Expiration timestamp for the OTP',
    example: '2023-05-16T15:35:00.000Z',
    type: Date,
    required: false,
    writeOnly: true,
  })
  otpExpiresAt: Date;

  @OneToMany(() => UserActivity, (activity) => activity.user)
  activities: UserActivity[];
  userId: any;
}
