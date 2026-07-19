
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  TreeChildren,
  TreeParent,
} from 'typeorm';

@Entity()
export class Menu {
  @ApiProperty({ example: 1, description: 'The unique identifier of the menu' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Dashboard', description: 'The name of the menu' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Parent menu ID (for hierarchical structure)',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  @Index()
  parentId: null | number = null;
  @ApiProperty({
    example: 'fa-dashboard',
    description: 'Icon class or identifier',
    required: false,
  })
  @Column({ length: 50, nullable: true })
  icon: string;

  @ApiProperty({
    example: '/dashboard',
    description: 'URL path for the menu',
    required: false,
  })
  @Column({ length: 255, nullable: true })
  url: string;

  @ApiProperty({
    example: 1,
    description: 'Display order of the menu',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  order: number;

  @ApiProperty({
    example: true,
    description: 'Whether this is a main menu item',
    default: false,
  })
  @Column({ name: 'is_main_menu', type: 'boolean', default: false })
  isMainMenu: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the menu is active',
    default: true,
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether this is an admin menu item',
    default: false,
  })
  @Column({ name: 'is_admin_menu', type: 'boolean', default: false })
  isAdminMenu: boolean;

  @ApiProperty({
    type: () => [Menu],
    description: 'Child menu items',
    required: false,
  })
  @TreeChildren()
  children: Menu[];

  @ApiProperty({
    type: () => Menu,
    description: 'Parent menu item',
    required: false,
  })
  @TreeParent()
  parent: Menu;

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
