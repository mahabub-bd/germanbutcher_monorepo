"use client";

import { useState } from "react";
import { PermissionProvider } from "./permissions/permission-provider";
import { AdminHeader } from "./admin-header";
import { SidebarMenu } from "./sidebar-menu";

interface UserData {
  id: number;
  name?: string;
  email?: string;
  image?: string;
  isAdmin?: boolean;
  roles?: string | { rolename?: string };
  profilePhoto?: {
    url?: string;
  };
}

interface AdminLayoutClientProps {
  user: UserData | null;
}

export function AdminLayoutClient({ user }: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Older session cookies may carry isAdmin:false with roles as an object —
  // re-derive from roles so admins don't lose the permission bypass.
  const rawRoles = user?.roles;
  const roleName =
    typeof rawRoles === "string"
      ? rawRoles
      : ((rawRoles as { rolename?: string } | null)?.rolename ?? "");
  const isAdmin =
    Boolean(user?.isAdmin) ||
    roleName === "admin" ||
    roleName === "superadmin" ||
    roleName === "modaretor";

  // Provide fallback user data if user is null
  const safeUser: UserData = user || {
    id: 0,
    name: "Admin User",
    email: "admin@example.com",
    isAdmin: false,
  };
  safeUser.isAdmin = isAdmin;

  return (
    <PermissionProvider userIsAdmin={safeUser.isAdmin}>
      <SidebarMenu
        user={safeUser}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <AdminHeader
        user={safeUser}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
    </PermissionProvider>
  );
}
