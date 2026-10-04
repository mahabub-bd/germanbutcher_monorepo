"use client";

import { useCartContext } from "@/contexts/cart-context";
import { UserTypes } from "@/utils/types";
import { ChefHat, Grid3X3, Home, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  activePattern: string | RegExp;
  badge?: boolean;
}

interface MobileBottomHeaderProps {
  user: UserTypes;
}

// Memoized navigation item component
const NavItem = memo(
  ({
    item,
    isActive,
    productCount,
  }: {
    item: NavigationItem;
    isActive: boolean;
    productCount: number;
  }) => {
    const Icon = item.icon;
    const showBadge = item.badge && productCount > 0;
    const badgeText = productCount > 99 ? "99+" : productCount.toString();

    const badge = showBadge ? (
      <span
        className="absolute -top-1.5 -right-2 bg-primaryColor text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white will-change-transform"
        style={{ transform: "translateZ(0)" }} // Force GPU acceleration
      >
        {badgeText}
      </span>
    ) : null;

    if (isActive) {
      // Active item: raised red circle popping above the floating bar
      return (
        <Link
          href={item.href}
          className="relative flex flex-col items-center flex-1 min-w-0"
          aria-label={`Navigate to ${item.name}${showBadge ? ` (${productCount} items)` : ""}`}
          prefetch={true}
        >
          <span className="relative -mt-6 flex size-11 items-center justify-center rounded-full bg-gradient-to-b from-secondaryColor to-primaryColor ring-[3px] ring-white shadow-md shadow-primaryColor/40">
            <Icon className="size-5 text-white" strokeWidth={2} />
            {badge}
          </span>
          <span className="mt-0.5 text-xs font-semibold text-primaryColor">
            {item.name}
          </span>
          <span
            className="mt-0.5 h-1 w-7 rounded-full bg-primaryColor"
            aria-hidden
          />
        </Link>
      );
    }

    return (
      <Link
        href={item.href}
        className="flex flex-col items-center justify-center gap-1 px-2 min-w-0 flex-1 py-2 group"
        aria-label={`Navigate to ${item.name}${showBadge ? ` (${productCount} items)` : ""}`}
        prefetch={true}
      >
        <span className="relative">
          <Icon
            className="size-6 text-gray-500 transition-colors duration-200 group-hover:text-primaryColor"
            strokeWidth={1.8}
          />
          {badge}
        </span>
        <span className="text-xs text-gray-500 transition-colors duration-200 group-hover:text-primaryColor">
          {item.name}
        </span>
      </Link>
    );
  }
);

NavItem.displayName = "NavItem";

export const MobileBottomHeader = memo(({ user }: MobileBottomHeaderProps) => {
  const pathname = usePathname();
  const { getCartTotals } = useCartContext();

  // Memoize cart totals to prevent unnecessary recalculations
  const cartTotals = useMemo(() => getCartTotals(), [getCartTotals]);
  const { productCount } = cartTotals;

  // Memoize navigation items to prevent recreation on every render
  const navigationItems: NavigationItem[] = useMemo(
    () => [
      {
        name: "Category",
        href: "/categories",
        icon: Grid3X3,
        activePattern: /^\/categories/,
      },
      {
        name: "Products",
        href: "/products",
        icon: ChefHat,
        activePattern: /^\/products/,
      },
      {
        name: "Home",
        href: "/",
        icon: Home,
        activePattern: "/",
      },
      {
        name: "Cart",
        href: "/cart",
        icon: ShoppingCart,
        activePattern: "/cart",
        badge: true,
      },
      {
        name: "Account",
        href: `/user/${user?.id}/profile`,
        icon: User,
        activePattern: /^\/user/,
      },
    ],
    [user?.id]
  );

  // Memoize active states to prevent regex execution on every render
  const activeStates = useMemo(() => {
    const states = new Map<string, boolean>();
    navigationItems.forEach((item) => {
      if (typeof item.activePattern === "string") {
        states.set(item.name, pathname === item.activePattern);
      } else {
        states.set(item.name, item.activePattern.test(pathname));
      }
    });
    return states;
  }, [navigationItems, pathname]);

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-safe",
        "pointer-events-none"
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-md flex items-end justify-around",
          "rounded-3xl bg-white ring-1 ring-gray-100 px-2 pt-2 pb-1.5",
          "shadow-[0_-6px_24px_rgba(0,0,0,0.10)]",
          "pointer-events-auto"
        )}
      >
        {navigationItems.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={activeStates.get(item.name) || false}
            productCount={productCount}
          />
        ))}
      </div>
    </nav>
  );
});

MobileBottomHeader.displayName = "MobileBottomHeader";
