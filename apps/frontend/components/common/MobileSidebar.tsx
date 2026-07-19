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
    <div className="flex overflow-x-scroll justify-between rounded-sm sm:justify-normal gap-4 bg-white shadow-[0px_-0.3px_5.5px_0px_rgba(0,0,0,0.02)] p-2 sm:p-4 w-full">
      {navItems.map((item, idx) => {
        const active = isActive(item.href);
        const baseTextColor = active
          ? "text-primaryColor"
          : "text-descriptionColor group-hover:text-primaryColor";

        return (
          <Link
            key={idx}
            href={item.href}
            className={`
              group flex items-center gap-1 text-center px-2 py-2 rounded-sm lg:rounded-lg hover:bg-primaryColor/10
              transition-colors duration-200 ${active ? "bg-primaryColor/10" : ""}
            `}
          >
            <div
              className={`h-[12px] w-[14px] flex justify-center items-center text-xl font-medium ${baseTextColor}`}
            >
              {item.icon}
            </div>
            <span
              className={`text-sm whitespace-nowrap font-medium ${baseTextColor}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default MobileSidebar;
