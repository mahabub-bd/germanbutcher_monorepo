"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  description?: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ navItems }) => {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {navItems.map((item: NavItem) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  group relative flex items-center gap-3 px-4 py-3 min-w-fit
                  border-b-2 transition-all duration-200
                  hover:bg-gray-50 hover:border-primaryColor/50
                  ${
                    active
                      ? "border-primaryColor bg-primaryColor/5 text-primaryColor"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                {/* Icon */}
                <div
                  className={`
                    w-5 h-5 flex-shrink-0 transition-colors duration-200
                    ${
                      active
                        ? "text-primaryColor"
                        : "text-gray-500 group-hover:text-gray-700"
                    }
                  `}
                >
                  {item.icon}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-sm font-medium whitespace-nowrap transition-colors duration-200
                    ${
                      active
                        ? "text-primaryColor"
                        : "text-gray-700 group-hover:text-gray-900"
                    }
                  `}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primaryColor"></div>
                )}
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
          <div
            key={`${item.label}-desc`}
            className="px-4 py-3 bg-primaryColor/5 border-b border-gray-200"
          >
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
