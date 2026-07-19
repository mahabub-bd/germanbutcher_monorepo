// src/auth/guards/menu.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MenuPermissionService } from 'src/menu-permission/menu-permission.service';
import { MenuService } from 'src/menu/menu.service';

@Injectable()
export class MenuGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private menuService: MenuService,
    private menuPermissionService: MenuPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const menuPath = this.reflector.get<string>('menu', context.getHandler());

    if (!menuPath) {
      return true; // No menu restriction
    }

    const menu = await this.menuService.findByPath(menuPath);
    if (!menu) {
      return false; // Menu doesn't exist
    }

    const permissions = await this.menuPermissionService.getUserMenuPermissions(
      user.id,
    );
    const permission = permissions.find((p) => p.menuId === menu.id);

    return permission?.canView || false;
  }
}
