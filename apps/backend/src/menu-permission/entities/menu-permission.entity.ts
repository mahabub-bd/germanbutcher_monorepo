import { ApiProperty } from '@nestjs/swagger';
import { Menu } from 'src/menu/entities/menu.entity';
import { Role } from 'src/roles/entities/role.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class MenuPermission {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: 'Permission ID' })
  id: number;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'roleId' })
  @ApiProperty({ type: () => Role, description: 'Associated role' })
  role: Role;

  @Column()
  @ApiProperty({ example: 1, description: 'Role ID' })
  roleId: number;

  @ManyToOne(() => Menu, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuId' })
  @ApiProperty({ type: () => Menu, description: 'Associated menu' })
  menu: Menu;

  @Column()
  @ApiProperty({ example: 1, description: 'Menu ID' })
  menuId: number;

  @Column({ default: false })
  @ApiProperty({ example: false, description: 'Can view this menu' })
  canView: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp',
    readOnly: true,
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update timestamp',
    readOnly: true,
  })
  updatedAt: Date;
}
