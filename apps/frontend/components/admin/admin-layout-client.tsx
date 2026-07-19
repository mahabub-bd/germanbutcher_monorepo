"use client";

import { useState } from "react";
import { AdminHeader } from "./admin-header";
import { SidebarMenu } from "./sidebar-menu";

interface UserData {
  id: number;
  name?: string;
  email?: string;
  image?: string;
  isAdmin?: boolean;
  profilePhoto?: {
    url?: string;
  };
}

interface AdminLayoutClientProps {
  user: UserData | null;
}

export function AdminLayoutClient({ user }: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Provide fallback user data if user is null
  const safeUser: UserData = user || {
    id: 0,
    name: "Admin User",
    email: "admin@example.com",
    isAdmin: false,
  };

  return (
    <>
      <SidebarMenu
        user={safeUser}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <AdminHeader
        user={safeUser}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
    </>
  );
}
