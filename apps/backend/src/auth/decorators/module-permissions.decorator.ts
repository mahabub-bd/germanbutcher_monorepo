import { SetMetadata } from '@nestjs/common';

export const MODULE_PERMISSIONS_KEY = 'module_permissions';

export type PermissionAction = 'canView' | 'canCreate' | 'canEdit' | 'canDelete';

/**
 * Declares which admin menu (module) a controller's endpoints belong to.
 * PermissionGuard maps the HTTP method to an action (GET→canView, POST→canCreate,
 * PUT/PATCH→canEdit, DELETE→canDelete) and checks the caller's role permission
 * for that menu URL. The URL must exactly match a row in the menu table.
 */
export const ModulePermissions = (menuUrl: string) =>
  SetMetadata(MODULE_PERMISSIONS_KEY, menuUrl);
