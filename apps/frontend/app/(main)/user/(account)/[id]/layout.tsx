import React from "react";

import { getUser } from "@/actions/auth";
import MobileSidebar from "@/components/common/MobileSidebar";
import { redirect } from "next/navigation";

import Sidebar from "@/components/common/Sidebar";
import ProfileBreadcrumb from "@/components/user-account/profile-breadcrumb";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  Bell,
  Headphones,
  Heart,
  LifeBuoy,
  LucideIcon,
  Mail,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";

interface UserProfileLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const UserProfileLayout: React.FC<UserProfileLayoutProps> = async ({
  children,
  params,
}) => {
  const user = await getUser();
  const { id } = await params;

  // Account pages are self-service only — a logged-in user may never browse
  // another user's data by editing the id in the URL.
  if (String(user?.id) !== id) {
    redirect(`/user/${user?.id}/profile`);
  }

  interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    description: string;
    colors: string;
    activeColors: string;
  }


  const TAB_META: Record<
    string,
    {
      icon: LucideIcon;
      description: string;
      colors: string;
      activeColors: string;
    }
  > = {
    "/user/profile": {
      icon: User,
      description: "Manage your personal information",
      colors:
        "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
      activeColors:
        "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-blue-950",
    },
    "/user/orders": {
      icon: ShoppingBag,
      description: "Track and manage your orders",
      colors:
        "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
      activeColors:
        "bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-400 dark:text-emerald-950",
    },
    "/user/addresses": {
      icon: MapPin,
      description: "Manage shipping addresses",
      colors:
        "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
      activeColors:
        "bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-400 dark:text-amber-950",
    },
    "/user/wishlist": {
      icon: Heart,
      description: "Your saved items",
      colors:
        "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
      activeColors:
        "bg-rose-600 text-white hover:bg-rose-600 dark:bg-rose-400 dark:text-rose-950",
    },
    "/user/reviews": {
      icon: Star,
      description: "Reviews you've written",
      colors:
        "bg-violet-50 text-violet-800 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70",
      activeColors:
        "bg-violet-600 text-white hover:bg-violet-600 dark:bg-violet-400 dark:text-violet-950",
    },
    "/user/notifications": {
      icon: Bell,
      description: "Your notifications",
      colors:
        "bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/70",
      activeColors:
        "bg-sky-600 text-white hover:bg-sky-600 dark:bg-sky-400 dark:text-sky-950",
    },
    "/user/support": {
      icon: LifeBuoy,
      description: "Your support requests",
      colors:
        "bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/70",
      activeColors:
        "bg-orange-600 text-white hover:bg-orange-600 dark:bg-orange-400 dark:text-orange-950",
    },
  };

  const FALLBACK_TAB_STYLE = {
    colors:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900",
    activeColors:
      "bg-slate-800 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900",
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
        icon: <Icon className="size-4" />,
        label: name,
        href: `/user/${userId}${url.replace(/^\/user/, "")}`,
        description: meta?.description ?? name,
        colors: meta?.colors ?? FALLBACK_TAB_STYLE.colors,
        activeColors: meta?.activeColors ?? FALLBACK_TAB_STYLE.activeColors,
      };
    });

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
              <div className="shadow-md rounded-lg overflow-hidden">
                {/* User Profile Header */}
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3.5">
                    {user?.profilePhoto?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profilePhoto.url}
                        alt={user?.name || "Profile"}
                        className="size-14 shrink-0 rounded-full bg-gray-50 object-contain p-0.5 ring-2 ring-gray-200"
                      />
                    ) : (
                      <div className="size-14 shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="size-7 text-gray-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-castor text-lg leading-tight font-semibold text-gray-900 truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="mt-0.5 text-xs font-medium tracking-wide text-gray-500 uppercase truncate">
                        Account Settings
                      </p>
                      {user?.email && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="size-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      )}
                    </div>
                    {user?.isVerified && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
                        <ShieldCheck className="size-3.5" />
                        Verified
                      </span>
                    )}
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
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center gap-3 px-3.5 py-3 border-b border-gray-100">
                  {user?.profilePhoto?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePhoto.url}
                      alt={user?.name || "Profile"}
                      className="size-11 shrink-0 rounded-full bg-gray-50 object-contain p-0.5 ring-2 ring-gray-200"
                    />
                  ) : (
                    <div className="size-11 shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="size-5 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-castor text-base leading-tight font-semibold text-gray-900 truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium tracking-wide text-gray-500 uppercase truncate">
                      Account Settings
                    </p>
                  </div>
                  {user?.isVerified && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
                      <ShieldCheck className="size-3.5" />
                      <span className="hidden sm:inline">Verified</span>
                    </span>
                  )}
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
