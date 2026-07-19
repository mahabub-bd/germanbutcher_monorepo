"use client";

import { User } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { BreadcrumbItem, PageBreadcrumb } from "../ui/page-breadcrumb";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  description: string;
}

interface ProfileBreadcrumbProps {
  navItems: NavItem[];
  baseLabel?: string;
  baseHref?: string;
  baseIcon?: React.ReactNode;
}

interface BreadcrumbConfig {
  baseLabel: string;
  baseHref: string;
  baseIcon: React.ReactNode;
}

const DEFAULT_CONFIG: BreadcrumbConfig = {
  baseLabel: "My Account",
  baseHref: "/profile",
  baseIcon: <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
};

/**
 * Creates breadcrumb items for profile navigation
 */
const createBreadcrumbItems = (
  pathname: string,
  navItems: NavItem[],
  config: BreadcrumbConfig
): BreadcrumbItem[] => {
  const baseItem: BreadcrumbItem = {
    label: config.baseLabel,
    href: config.baseHref,
    icon: config.baseIcon,
    isActive: pathname === config.baseHref,
  };

  // If we're on the base profile page, return just the base item
  if (pathname === config.baseHref) {
    return [baseItem];
  }

  // Find the current page from navigation items
  const currentPage = navItems.find((item) => pathname.startsWith(item.href));

  if (!currentPage) {
    // If no matching nav item found, still show base item as active fallback
    return [{ ...baseItem, isActive: true }];
  }

  // Clone the icon to avoid React warnings about reusing elements
  const clonedIcon = React.isValidElement(currentPage.icon)
    ? React.cloneElement(currentPage.icon, {
        key: `icon-${currentPage.href}`,
      })
    : currentPage.icon;

  const currentPageItem: BreadcrumbItem = {
    label: currentPage.label,
    icon: clonedIcon,
    isActive: true,
  };

  return [baseItem, currentPageItem];
};

/**
 * ProfileBreadcrumb Component
 *
 * Renders breadcrumb navigation for profile pages with automatic active state detection
 */
const ProfileBreadcrumb: React.FC<ProfileBreadcrumbProps> = ({
  navItems,
  baseLabel = DEFAULT_CONFIG.baseLabel,
  baseHref = DEFAULT_CONFIG.baseHref,
  baseIcon = DEFAULT_CONFIG.baseIcon,
}) => {
  const pathname = usePathname();

  const config: BreadcrumbConfig = {
    baseLabel,
    baseHref,
    baseIcon,
  };

  const breadcrumbItems = React.useMemo(
    () => createBreadcrumbItems(pathname, navItems, config),
    [pathname, navItems, config]
  );

  return <PageBreadcrumb items={breadcrumbItems} />;
};

export default ProfileBreadcrumb;
