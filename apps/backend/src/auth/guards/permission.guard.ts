import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Menu } from 'src/menu/entities/menu.entity';
import { MenuPermissionService } from 'src/menu-permission/menu-permission.service';
import { MenuService } from 'src/menu/menu.service';
import {
  MODULE_PERMISSIONS_KEY,
  PermissionAction,
} from '../decorators/module-permissions.decorator';

const ACTION_BY_METHOD: Record<string, PermissionAction> = {
  GET: 'canView',
  POST: 'canCreate',
  PUT: 'canEdit',
  PATCH: 'canEdit',
  DELETE: 'canDelete',
};

/**
 * Opt-in guard: only active on controllers/endpoints carrying the
 * @ModulePermissions(menuUrl) metadata. Maps the HTTP method to a permission
 * action and checks the caller role's menu_permission row for that menu
 * (falling back to ancestor menus = section inheritance).
 * Roles 'superadmin' and 'admin' bypass the check.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private menuService: MenuService,
    private menuPermissionService: MenuPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const menuUrl = this.reflector.getAllAndOverride<string>(
      MODULE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!menuUrl) return true; // opt-in guard

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.userId || !user?.roleId) {
      throw new ForbiddenException('Missing authenticated role');
    }
    if (user.role === 'superadmin' || user.role === 'admin') return true;

    const action = ACTION_BY_METHOD[request.method];
    if (!action) {
      throw new ForbiddenException(`Unsupported method ${request.method}`);
    }

    const menu: Menu | undefined = await this.menuService.findByPath(menuUrl);
    if (!menu) {
      throw new ForbiddenException(`Unknown module menu: ${menuUrl}`);
    }

    const permissions = await this.menuPermissionService.getPermissionsForRole(
      user.roleId,
    );
    // JWT roleId can be stale: deny everything if the role has been deactivated.
    if (permissions.length && !permissions[0].role.isActive) {
      throw new ForbiddenException('Role is inactive');
    }

    if (await this.hasAction(permissions, menu, action)) return true;
    throw new ForbiddenException(
      `Missing '${action}' permission for ${menuUrl}`,
    );
  }

  /** Exact menu row first, then nearest ancestor row granting the action. */
  private async hasAction(
    permissions: MenuPermissionLike[],
    menu: Menu,
    action: PermissionAction,
  ): Promise<boolean> {
    const byMenuId = new Map(permissions.map((p) => [p.menuId, p]));
    const lineage = await this.menuService.getMenuLineage(menu);
    for (const candidate of lineage) {
      const perm = byMenuId.get(candidate.id);
      if (perm && perm[action]) return true;
    }
    return false;
  }
}

type MenuPermissionLike = {
  menuId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};
