// src/menu-permission/menu-permission.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from 'src/menu/entities/menu.entity';
import { Role } from 'src/roles/entities/role.entity';
import { MenuPermission } from './entities/menu-permission.entity';
import { MenuPermissionController } from './menu-permission.controller';
import { MenuPermissionService } from './menu-permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuPermission, Role, Menu])],
  controllers: [MenuPermissionController],
  providers: [MenuPermissionService],
  exports: [MenuPermissionService],
})
export class MenuPermissionModule {}

// Don't forget to add MenuPermissionModule to your AppModule imports
