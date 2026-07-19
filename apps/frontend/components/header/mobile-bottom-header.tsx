"use client";

import { useCartContext } from "@/contexts/cart-context";
import { UserTypes } from "@/utils/types";
import { ChefHat, Grid3X3, Home, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { memo, useMemo } from "react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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

    return (
      <Link
        href={item.href}
        className="flex flex-col items-center justify-center px-2 min-w-0 flex-1 group"
        aria-label={`Navigate to ${item.name}${showBadge ? ` (${productCount} items)` : ""}`}
        prefetch={true}
      >
        {/* Icon container */}
        <div className="relative mb-1">
          <Icon
            className={`w-6 h-6 transition-colors duration-200 ${
              isActive
                ? "text-primaryColor"
                : "text-gray-400 group-hover:text-gray-600"
            }`}
          />

          {/* Optimized badge with transform for performance */}
          {showBadge && (
            <div
              className="absolute -top-2 -right-2.5 bg-primaryColor text-white text-xs font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 will-change-transform"
              style={{ transform: "translateZ(0)" }} // Force GPU acceleration
            >
              {badgeText}
            </div>
          )}
        </div>

        {/* Label */}
        <span
          className={`text-xs transition-colors duration-200 ${
            isActive
              ? "text-primaryColor font-medium"
              : "text-gray-400 group-hover:text-gray-600"
          }`}
        >
          {item.name}
        </span>

        {/* Active indicator with GPU acceleration */}
        {isActive && (
          <div
            className="absolute bottom-0 w-12 h-1 bg-primaryColor rounded-full will-change-transform"
            style={{ transform: "translateZ(0)" }}
          />
        )}
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 will-change-transform">
      <div className="flex items-center justify-around py-3 px-3 pb-safe">
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
