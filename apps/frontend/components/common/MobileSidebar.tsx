"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface MobileSidebarProps {
  navItems: NavItem[];
}

function MobileSidebar({ navItems }: MobileSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex overflow-x-auto scrollbar-hide gap-1 p-2 pt-1 w-full">
      {navItems.map((item, idx) => {
        const active = isActive(item.href);

        return (
          <Link
            key={idx}
            href={item.href}
            className={`
              group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium
              transition-colors duration-200 [&>svg]:!h-4 [&>svg]:!w-4
              ${
                active
                  ? "bg-primaryColor/10 text-primaryColor"
                  : "text-gray-500 hover:bg-primaryColor/5 hover:text-primaryColor"
              }
            `}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default MobileSidebar;
