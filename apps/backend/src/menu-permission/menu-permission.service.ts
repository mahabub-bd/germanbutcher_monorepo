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
      children: menu.children.filter((child) => menuIds.includes(child.id)),
    }));
  }
  async deletePermission(permissionId: number): Promise<void> {
    await this.menuPermissionRepository.delete(permissionId);
  }
}
