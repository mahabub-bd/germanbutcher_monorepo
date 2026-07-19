"use client";

import React, { useState } from "react";

import { ChevronDown, LogOut, Menu, User } from "lucide-react";
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
import { GermanbutcherLogo } from "@/public/images";
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

export function AdminHeader({
  user,
  onMenuClick,
}: {
  user: { name?: string; email?: string; image?: string };
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split("/").filter(Boolean);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Format path segments for breadcrumb (capitalize, replace hyphens with spaces)
  const formatSegment = (segment: string) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const result: authResponse = await logout();

      if (result.statusCode === 200) {
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-primaryColor shadow-lg px-6">
      {/* Mobile layout: Hamburger - Logo - Notification - Home */}
      <div className="md:hidden flex w-full items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/10 text-white hover:text-white"
          title="Menu"
          onClick={onMenuClick}
        >
          <Menu className="size-6" />
        </Button>
        <Link
          href="/"
          className="flex items-center"
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
          <div className="text-white [&_button]:text-white [&_button:hover]:text-white [&_button:hover]:bg-white/10">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Desktop layout: Home button, logo and breadcrumb */}

      <Link
        href="/"
        className="hidden md:flex items-center"
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
      <div className="hidden md:flex flex-1 items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList className="text-white text-base [&_a]:text-white [&_a:hover]:text-white/80 [&_span]:text-white">
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
                      <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
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
      </div>
      <div className="hidden md:flex items-center gap-4">
        {/* Notification Bell */}
        <div className="text-white [&_button]:text-white [&_button:hover]:text-white [&_button:hover]:bg-white/10">
          <NotificationBell />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-white hover:bg-white/10 hover:text-white rounded-lg px-3 py-2"
            >
              <Avatar className="h-8 w-8 ring-2 ring-white/20">
                <AvatarImage
                  src={user?.image || ""}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-gradient-to-br from-primaryColor to-secondaryColor text-white font-semibold">
                  {user?.name?.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium text-white">
                  {user?.name}
                </span>
                <span className="text-xs text-white/80">{user?.email}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
    </header>
  );
}
