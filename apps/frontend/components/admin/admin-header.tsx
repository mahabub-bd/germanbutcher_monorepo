"use client";

import React, { useEffect, useState } from "react";

import {
  Maximize,
  Menu,
  Minimize,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/notification-bell";
import { InboxModal } from "@/components/admin/inbox/inbox-modal";
import { Button } from "@/components/ui/button";
import { fetchProtectedData } from "@/utils/api-utils";
import { AdminHeaderBg, GermanbutcherLogo } from "@/public/images";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

// Rounded tile that sits behind each icon in the header. Solid black tiles
// keep the icons legible over the photo.
const iconTileClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/80 text-white shadow-sm transition-all duration-150 hover:bg-black hover:text-white active:scale-90 active:bg-black active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:text-white";

// Hamburger variant — primary red instead of black.
const menuTileClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor text-white shadow-sm transition-all duration-150 hover:bg-primaryColor/90 hover:text-white active:scale-90 active:bg-primaryColor/90 active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:text-white";

// Thin separator between header clusters.
function HeaderDivider() {
  return <div className="hidden h-6 w-px bg-primaryColor/20 lg:block" aria-hidden />;
}

export function AdminHeader({
  onMenuClick,
  onToggleSidebar,
}: {
  user?: { name?: string; email?: string; image?: string };
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
}) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Unread inbox badge — pending contact messages, refreshed on navigation
  // and once a minute while the header stays mounted.
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let active = true;
    const loadUnread = async () => {
      try {
        const stats = await fetchProtectedData<{
          byStatus?: Record<string, number>;
        }>("contact-messages/statistics");
        if (active) {
          setUnreadMessages(stats?.byStatus?.pending ?? 0);
        }
      } catch {
        // best-effort badge — ignore auth/permission failures
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pathname]);

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
            className={menuTileClass}
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
          <div className="flex items-center gap-2">
            <InboxModal
              unreadCount={unreadMessages}
              triggerClassName={iconTileClass}
            />
            <NotificationBell
              buttonClassName="h-9 w-9 rounded-lg bg-black/80 p-0 text-white shadow-sm transition-all duration-150 hover:bg-black hover:text-white hover:opacity-100 focus:bg-black focus:text-white active:scale-90 active:bg-black active:text-white active:opacity-100"
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
          className={`${menuTileClass} hidden md:inline-flex`}
          title="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <Menu className="size-4" />
        </Button>

        <HeaderDivider />

        <Breadcrumb className="hidden lg:block">
          <BreadcrumbList className="text-base font-semibold [&_a]:text-primaryColor [&_a:hover]:text-primaryColor/80 [&_span]:text-primaryColor [&_span[aria-current='page']]:text-primaryColor">
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
              buttonClassName="h-9 w-9 rounded-lg bg-black/80 p-0 text-white shadow-sm transition-all duration-150 hover:bg-black hover:text-white hover:opacity-100 focus:bg-black focus:text-white active:scale-90 active:bg-black active:text-white active:opacity-100"
            />
          </div>

          <InboxModal
            unreadCount={unreadMessages}
            triggerClassName={iconTileClass}
          />

          <Link
            href="/admin/settings/business-info"
            title="Settings"
            className={iconTileClass}
          >
            <Settings className="size-4" />
          </Link>

          <Button
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
          </Button>

          <HeaderDivider />
        </div>
      </div>
    </header>
  );
}
