import React from "react";

import { getUser } from "@/actions/auth";
import MobileSidebar from "@/components/common/MobileSidebar";

import Sidebar from "@/components/common/Sidebar";
import ProfileBreadcrumb from "@/components/user-account/profile-breadcrumb";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  Bell,
  Headphones,
  Heart,
  LifeBuoy,
  LucideIcon,
  MapPin,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";

interface UserProfileLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  description: string;
}

/** Per-tab icon and copy, keyed by the menu url. Tabs come from the menu
 * table (user Dashboard's children); anything unknown falls back to defaults. */
const TAB_META: Record<
  string,
  { icon: LucideIcon; description: string }
> = {
  "/user/profile": {
    icon: User,
    description: "Manage your personal information",
  },
  "/user/orders": {
    icon: ShoppingBag,
    description: "Track and manage your orders",
  },
  "/user/addresses": {
    icon: MapPin,
    description: "Manage shipping addresses",
  },
  "/user/wishlist": {
    icon: Heart,
    description: "Your saved items",
  },
  "/user/reviews": {
    icon: Star,
    description: "Reviews you've written",
  },
  "/user/notifications": {
    icon: Bell,
    description: "Your notifications",
  },
  "/user/support": {
    icon: LifeBuoy,
    description: "Your support requests",
  },
};

interface MenuTreeItem {
  id: number;
  name: string;
  url: string | null;
  children?: MenuTreeItem[];
}

const buildNavItems = (
  userId: number | string,
  tabs: { name: string; url: string }[],
): NavItem[] =>
  tabs.map(({ name, url }) => {
    const meta = TAB_META[url];
    const Icon = meta?.icon ?? User;
    return {
      icon: <Icon className="w-5 h-5" />,
      label: name,
      href: `/user/${userId}${url.replace(/^\/user/, "")}`,
      description: meta?.description ?? name,
    };
  });

const UserProfileLayout: React.FC<UserProfileLayoutProps> = async ({
  children,
}) => {
  const user = await getUser();

  // Tabs are DB-driven: active sub menus of the user Dashboard main menu
  // (menu/tree?isAdminMenu=false).
  let navItems: NavItem[] = [];
  try {
    const tree = await fetchProtectedData<MenuTreeItem[]>(
      "menu/tree?isAdminMenu=false",
    );
    const tabs = (tree ?? [])
      .flatMap((menu) => menu.children ?? [])
      .filter((tab) => tab.url && tab.url.startsWith("/user/"));
    navItems = buildNavItems(
      user.id,
      tabs.map((tab) => ({ name: tab.name, url: tab.url! })),
    );
  } catch (error) {
    console.error("Error fetching account tabs from menu API:", error);
  }

  return (
    <div className="min-h-screen">
      <ProfileBreadcrumb navItems={navItems} />

      <div className="container mx-auto md:px-0 px-4 md:py-8 py-4">
        <div className="grid grid-cols-12 md:gap-8 gap-4">
          {/* Desktop Sidebar */}
          <div className="col-span-12">
            <div className="hidden lg:block sticky top-8">
              <div className=" shadow-md rounded-md  overflow-hidden">
                {/* User Profile Header */}
                <div className="bg-linear-to-br from-primaryColor via-[#6d0000] to-primaryColor p-4 text-white">
                  <div className="flex items-center space-x-3">
                    {user?.profilePhoto?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profilePhoto.url}
                        alt={user?.name || "Profile"}
                        className="w-12 h-12 shrink-0 rounded-full border border-white/40 object-contain bg-white"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">
                        {user?.name || "User"}
                      </h3>
                      <p className="text-white/80 text-sm">Account Settings</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="p-0">
                  <Sidebar navItems={navItems} />
                </div>
              </div>
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden mb-4">
              <div className="bg-white rounded-md shadow-md overflow-hidden">
                <div className="flex items-center gap-2.5 p-3 pb-1">
                  {user?.profilePhoto?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePhoto.url}
                      alt={user?.name || "Profile"}
                      className="w-9 h-9 shrink-0 rounded-full border border-gray-100 object-contain bg-white"
                    />
                  ) : (
                    <div className="w-9 h-9 shrink-0 bg-primaryColor rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {user?.name || "User"}
                    </h3>
                    <p className="text-gray-500 text-xs">Account Settings</p>
                  </div>
                </div>
                <MobileSidebar navItems={navItems} />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12">
            <div className="rounded-md">
              <main>{children}</main>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Floating Button (Mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button className="bg-linear-to-r from-primaryColor to-red-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <Headphones className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UserProfileLayout;
