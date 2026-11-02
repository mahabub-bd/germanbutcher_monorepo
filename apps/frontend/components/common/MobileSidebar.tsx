"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  /** Tailwind classes for the inactive pill (tinted background style) */
  colors?: string;
  /** Tailwind classes for the active pill (solid background style) */
  activeColors?: string;
}

interface MobileSidebarProps {
  navItems: NavItem[];
}

interface ScrollMetrics {
  left: boolean;
  right: boolean;
}

const INITIAL_METRICS: ScrollMetrics = {
  left: false,
  right: false,
};

/**
 * Compact account tab strip for mobile/sub-desktop views — same pill-tab
 * style as the desktop Sidebar (tinted inactive, solid active).
 *
 * Scroll UX: no scrollbar is shown at all (native and custom). The strip is
 * still swipe-scrollable; discoverability comes from edge fade masks on the
 * sides that have off-screen tabs, and the active pill is centered on mount.
 */
function MobileSidebar({ navItems }: MobileSidebarProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>(INITIAL_METRICS);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const updateMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setMetrics({
      left: scrollLeft > 4,
      right: scrollLeft < maxScroll - 4,
    });
  }, []);

  // Flag scrollable edges and center the active pill on mount
  useEffect(() => {
    updateMetrics();
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [updateMetrics]);

  return (
    <div className="relative px-2.5 pt-1">
      <nav
        ref={scrollRef}
        role="tablist"
        aria-label="Account sections"
        onScroll={updateMetrics}
        className="scrollbar-none flex w-full snap-x items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-2.5 pt-1.5 [-webkit-overflow-scrolling:touch] [scroll-behavior:smooth]"
      >
        {navItems.map((item, idx) => {
          const active = isActive(item.href);

          return (
            <Link
              ref={active ? activeRef : undefined}
              key={idx}
              href={item.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className={`
                flex shrink-0 snap-center items-center gap-1.5 rounded-lg px-2.5
                py-1.5 text-xs font-semibold whitespace-nowrap transition-colors
                duration-200 focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primaryColor/50 focus-visible:ring-offset-1
                ${active
                  ? item.activeColors ??
                  "bg-primaryColor text-white dark:bg-primary-400 dark:text-primary-950"
                  : item.colors ??
                  "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-300"
                }
              `}
            >
              <span className="size-4 shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Edge fade scroll hints */}
      {metrics.left && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 bottom-2 left-0 w-8 bg-linear-to-r from-white to-transparent"
        />
      )}
      {metrics.right && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 bottom-2 w-8 bg-linear-to-l from-white to-transparent"
        />
      )}
    </div>
  );
}

export default MobileSidebar;
