"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  description?: string;
  /** Tailwind classes for the inactive pill (tinted background style) */
  colors?: string;
  /** Tailwind classes for the active pill (solid background style) */
  activeColors?: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

/**
 * Account tab strip — pill-tab design shared with the admin detail pages
 * (customer/product detail). Inactive tabs use tinted backgrounds, the
 * active tab uses a solid color. Below md, tabs show icons only with
 * sr-only labels; full labels appear from md upwards. When the strip
 * overflows, the active pill is centered on mount.
 */
const Sidebar: React.FC<SidebarProps> = ({ navItems }) => {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Bring the active pill into view if the strip scrolls horizontally
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav
          role="tablist"
          aria-label="Account sections"
          className="scrollbar-none flex w-full snap-x items-center gap-1.5 overflow-x-auto overscroll-x-contain px-2.5 py-2 [-webkit-overflow-scrolling:touch] sm:gap-2 sm:px-3 sm:py-2.5"
        >
          {navItems.map((item: NavItem) => {
            const active = isActive(item.href);
            return (
              <Link
                ref={active ? activeRef : undefined}
                key={item.label}
                href={item.href}
                role="tab"
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                className={`
                  flex shrink-0 snap-center items-center gap-1.5 rounded-lg
                  px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap
                  transition-colors duration-200 focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-primaryColor/50
                  focus-visible:ring-offset-1 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm
                  ${active
                    ? item.activeColors ??
                    "bg-primaryColor text-white dark:bg-primary-400 dark:text-primary-950"
                    : item.colors ??
                    "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-300"
                  }
                `}
              >
                {/* Icon */}
                <span className="size-4 shrink-0">{item.icon}</span>

                {/* Label */}
                <span className="hidden md:inline">{item.label}</span>
                <span className="sr-only md:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Description (Optional) */}
      {navItems.map((item: NavItem) => {
        const active = isActive(item.href);
        if (!active || !item.description) return null;

        return (
          <div key={`${item.label}-desc`} className="px-4 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
