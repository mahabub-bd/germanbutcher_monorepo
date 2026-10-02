// src/menu-permission/menu-permission.module.ts
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuModule } from 'src/menu/menu.module';
import { Menu } from 'src/menu/entities/menu.entity';
import { Role } from 'src/roles/entities/role.entity';
import { MenuPermission } from './entities/menu-permission.entity';
import { MenuPermissionController } from './menu-permission.controller';
import { MenuPermissionService } from './menu-permission.service';

// Global so PermissionGuard can inject MenuPermissionService and MenuService
// from any module that uses the guard
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([MenuPermission, Role, Menu]),
    MenuModule,
  ],
  controllers: [MenuPermissionController],
  providers: [MenuPermissionService],
  exports: [MenuPermissionService, MenuModule],
})
export class MenuPermissionModule {}
