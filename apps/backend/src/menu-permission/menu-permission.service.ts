// src/menu-permission/menu-permission.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Menu } from 'src/menu/entities/menu.entity';
import { Role } from 'src/roles/entities/role.entity';
import { In, Repository } from 'typeorm';
import { MenuPermission } from './entities/menu-permission.entity';

@Injectable()
export class MenuPermissionService {
  constructor(
    @InjectRepository(MenuPermission)
    private readonly menuPermissionRepository: Repository<MenuPermission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async createOrUpdatePermission(
    roleId: number,
    menuId: number,
    permissionData: Partial<MenuPermission>,
  ): Promise<MenuPermission> {
    const existingPermission = await this.menuPermissionRepository.findOne({
      where: { roleId, menuId },
    });

    if (existingPermission) {
      const updated = await this.menuPermissionRepository.save({
        ...existingPermission,
        ...permissionData,
      });
      return updated;
    }

    const newPermission = this.menuPermissionRepository.create({
      roleId,
      menuId,
      ...permissionData,
    });
    return this.menuPermissionRepository.save(newPermission);
  }

  async getPermissionsForRole(roleId: number): Promise<MenuPermission[]> {
    return this.menuPermissionRepository.find({
      where: { roleId },
      relations: ['menu'],
      order: { id: 'ASC' },
    });
  }

  async getUserMenuPermissions(userId: number): Promise<MenuPermission[]> {
    const user = await this.roleRepository.findOne({
      where: { users: { id: userId } },
      relations: ['users'],
    });

    if (!user) {
      return [];
    }

    return this.getPermissionsForRole(user.id);
  }

  async getAccessibleMenusForUser(userId: number): Promise<Menu[]> {
    const permissions = await this.getUserMenuPermissions(userId);
    const menuIds = permissions.filter((p) => p.canView).map((p) => p.menuId);

    if (menuIds.length === 0) {
      return [];
    }

    const allMenus = await this.menuRepository.find({
      where: { id: In(menuIds) },
      relations: ['children'],
      order: { order: 'ASC' },
    });

    const topLevelMenus = allMenus.filter((menu) => menu.parentId === null);

    return topLevelMenus.map((menu) => ({
      ...menu,
      children: menu.children
        .filter((child) => menuIds.includes(child.id))
        .sort((a, b) => a.order - b.order),
    }));
  }
  async deletePermission(permissionId: number): Promise<void> {
    await this.menuPermissionRepository.delete(permissionId);
  }

  /**
   * Batch upsert for the permission matrix. Rows not present in `entries`
   * are left untouched (backward compatible with the single PATCH endpoint).
   */
  async savePermissionsForRole(
    roleId: number,
    entries: {
      menuId: number;
      canView?: boolean;
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
    }[],
  ): Promise<MenuPermission[]> {
    return this.menuPermissionRepository.manager.transaction(async (manager) => {
      const saved: MenuPermission[] = [];
      for (const entry of entries) {
        const existing = await manager.findOne(MenuPermission, {
          where: { roleId, menuId: entry.menuId },
        });
        if (existing) {
          saved.push(await manager.save(MenuPermission, { ...existing, ...entry }));
        } else {
          saved.push(
            await manager.save(MenuPermission, manager.create(MenuPermission, { roleId, ...entry })),
          );
        }
      }
      return saved;
    });
  }

  /**
   * Fresh DB-truth permissions for the logged-in user (never from the JWT):
   * one entry per admin menu with url. Superadmin/admin get all-true without
   * needing rows; inactive roles get all-false.
   */
  async getMyPermissions(userId: number) {
    if (!userId) {
      throw new Error('getMyPermissions requires a userId');
    }
    const role = await this.roleRepository.findOne({
      where: { users: { id: userId } },
      relations: ['users'],
    });
    const adminMenus = await this.menuRepository.find({
      where: { isAdminMenu: true },
      order: { order: 'ASC' },
    });

    const emptyFlags = { canView: false, canCreate: false, canEdit: false, canDelete: false };
    if (!role || !role.isActive) {
      return {
        roleId: role?.id ?? 0,
        roleName: role?.rolename ?? '',
        isActive: false,
        permissions: adminMenus
          .filter((m) => Boolean(m.url))
          .map((m) => ({ menuId: m.id, name: m.name, url: m.url, ...emptyFlags })),
      };
    }

    const perms = await this.getPermissionsForRole(role.id);
    const byMenuId = new Map(perms.map((p) => [p.menuId, p]));
    const isAdmin = role.rolename === 'superadmin' || role.rolename === 'admin';

    return {
      roleId: role.id,
      roleName: role.rolename,
      isActive: true,
      permissions: adminMenus
        .filter((m) => Boolean(m.url))
        .map((m) => {
          const p = isAdmin ? undefined : byMenuId.get(m.id);
          return {
            menuId: m.id,
            name: m.name,
            url: m.url,
            canView: isAdmin || Boolean(p?.canView),
            canCreate: isAdmin || Boolean(p?.canCreate),
            canEdit: isAdmin || Boolean(p?.canEdit),
            canDelete: isAdmin || Boolean(p?.canDelete),
          };
        }),
    };
  }
}
