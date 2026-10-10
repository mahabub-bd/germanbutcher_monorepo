"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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
}

const DEFAULT_BASE_LABEL = "My Account";
const DEFAULT_BASE_HREF = "/profile";

function CrumbLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative text-gray-500 transition-colors hover:text-primaryColor after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primaryColor after:transition-all after:duration-300 hover:after:w-full"
    >
      {children}
    </Link>
  );
}

/**
 * Breadcrumb for profile pages, styled the same as the product details
 * page breadcrumb: plain home link, "/" separators and an animated
 * underline on hover. The current section is highlighted in primaryColor.
 */
const ProfileBreadcrumb: React.FC<ProfileBreadcrumbProps> = ({
  navItems,
  baseLabel = DEFAULT_BASE_LABEL,
  baseHref = DEFAULT_BASE_HREF,
}) => {
  const pathname = usePathname();

  const currentPage = navItems.find((item) => pathname.startsWith(item.href));
  const onBasePage = pathname === baseHref;

  return (
    <div className="border-b border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="container mx-auto md:px-0 px-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 overflow-x-auto py-2.5 text-xs sm:text-sm"
        >
          <Link
            href="/"
            aria-label="Home"
            className="flex shrink-0 items-center text-gray-500 transition-colors hover:text-primaryColor"
          >
            <Home className="size-4" />
          </Link>

          <span className="shrink-0 text-gray-300" aria-hidden>
            /
          </span>

          {!onBasePage && currentPage ? (
            <CrumbLink href={baseHref}>
              <span className="whitespace-nowrap">{baseLabel}</span>
            </CrumbLink>
          ) : (
            <span
              aria-current="page"
              className="truncate whitespace-nowrap font-medium text-primaryColor"
            >
              {baseLabel}
            </span>
          )}

          {currentPage && (
            <>
              <span className="shrink-0 text-gray-300" aria-hidden>
                /
              </span>
              <span
                aria-current="page"
                className="truncate whitespace-nowrap font-medium text-primaryColor"
              >
                {currentPage.label}
              </span>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default ProfileBreadcrumb;
