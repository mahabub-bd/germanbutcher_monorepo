"use client";

import React, { useEffect, useState } from "react";

import {
  ChevronDown,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  Settings,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { logout } from "@/actions/auth";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminHeaderBg, GermanbutcherLogo } from "@/public/images";
import { resetAuthTokenCache } from "@/utils/api-utils";
import { authResponse } from "@/utils/types";

import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

// Rounded tile that sits behind each icon in the light image header. Solid
// white tiles keep the icons legible over the photo.
const iconTileClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-primaryColor shadow-sm transition-all duration-150 hover:bg-white active:scale-90 active:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor/40";

// Thin separator between header clusters.
function HeaderDivider() {
  return <div className="hidden h-6 w-px bg-primaryColor/20 lg:block" aria-hidden />;
}

export function AdminHeader({
  user,
  onMenuClick,
  onToggleSidebar,
}: {
  user: { name?: string; email?: string; image?: string };
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split("/").filter(Boolean);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Format path segments for breadcrumb (capitalize, replace hyphens with spaces)
  const formatSegment = (segment: string) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const result: authResponse = await logout();

      if (result.statusCode === 200) {
        resetAuthTokenCache();
        toast.success("Logged out successfully");
        router.push("/auth/sign-in");
        router.refresh();
      } else {
        toast.error("Failed to log out");
      }
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <header className="sticky top-0 z-40 overflow-hidden bg-primaryColor shadow-lg">
      {/* Background image strip */}
      <Image
        src={AdminHeaderBg}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        priority
        className="pointer-events-none absolute inset-0 object-cover object-center"
      />

      {/* Decorative diagonal wedge behind the logo/menu cluster */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[380px] bg-black/5 [clip-path:polygon(0_0,100%_0,72%_100%,0_100%)] lg:block"
      />

      <div className="relative flex h-16 items-center gap-3 px-4  md:px-6">
        {/* Mobile layout: Hamburger - Logo - Notification */}
        <div className="flex w-full items-center justify-between md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg bg-white/70 text-primaryColor shadow-sm transition-all duration-150 hover:bg-white active:scale-90 active:bg-white"
            title="Menu"
            onClick={onMenuClick}
          >
            <Menu className="size-4" />
          </Button>
          <Link
            href="/"
            className="flex items-center transition-transform duration-150 active:scale-95"
            aria-label="Go to homepage"
          >
            <Image
              src={GermanbutcherLogo}
              alt="German Butcher logo"
              width={60}
              height={60}
              className="max-w-full max-h-full object-contain"
              priority
            />
          </Link>
          <div>
            <NotificationBell
              buttonClassName="h-9 w-9 rounded-lg bg-white/70 p-0 text-primaryColor shadow-sm transition-all duration-150 hover:bg-white hover:opacity-100 focus:bg-white active:scale-90 active:bg-white active:opacity-100"
            />
          </div>
        </div>

        {/* Desktop layout: logo, hamburger, breadcrumb, search, actions, account */}
        <Link
          href="/"
          className="hidden shrink-0 items-center md:flex"
          aria-label="Go to homepage"
        >
          <Image
            src={GermanbutcherLogo}
            alt="German Butcher logo"
            width={60}
            height={60}
            className="object-contain"
            priority
          />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className={`${iconTileClass} hidden md:inline-flex`}
          title="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <Menu className="size-4" />
        </Button>

        <HeaderDivider />

        <Breadcrumb className="hidden lg:block">
          <BreadcrumbList className="text-base [&_a]:text-muted-foreground [&_a:hover]:text-primaryColor [&_span]:text-muted-foreground [&_span[aria-current='page']]:text-primaryColor">
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" className="text-base">
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.slice(1).map((segment, index) => {
              const isLast = index === pathSegments.slice(1).length - 1;
              const href = `/admin/${pathSegments
                .slice(1, index + 2)
                .join("/")}`;

              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-primaryColor">
                        {formatSegment(segment)}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>
                        {formatSegment(segment)}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>


        <div className="ml-auto hidden items-center gap-3 md:flex">
          <HeaderDivider />

          <div className="relative">
            <NotificationBell
              buttonClassName="h-9 w-9 rounded-lg bg-white/70 p-0 text-primaryColor shadow-sm transition-all duration-150 hover:bg-white hover:opacity-100 focus:bg-white active:scale-90 active:bg-white active:opacity-100"
            />
          </div>

          <Link
            href="/admin/settings/business-info"
            title="Settings"
            className={iconTileClass}
          >
            <Settings className="size-4" />
          </Link>

          <button
            type="button"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={toggleFullscreen}
            className={iconTileClass}
          >
            {isFullscreen ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </button>

          <HeaderDivider />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-full bg-white/80 px-2 py-2.5 text-foreground shadow-sm transition-all duration-150 hover:bg-white hover:text-foreground active:scale-[0.97] active:bg-white"
              >
                <Avatar className="h-8 w-8 ring-1 ring-primaryColor/20">
                  <AvatarImage
                    src={user?.image || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-secondaryColor to-primaryColor text-sm font-semibold text-white">
                    {user?.name?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 flex-col items-start lg:flex">
                  <span className="flex max-w-[160px] items-center gap-1 truncate text-sm font-semibold text-foreground">
                    {user?.name}
                    <ChevronDown className="h-4 w-4 shrink-0 text-foreground" />
                  </span>
                  <span className="max-w-[180px] truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950 dark:focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
