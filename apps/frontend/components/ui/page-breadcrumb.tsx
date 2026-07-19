import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  isActive?: boolean;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumb({ items, className = '' }: PageBreadcrumbProps) {
  return (
    <div
      className={`sticky top-0 z-10 bg-white/95 backdrop-blur-sm  ${className}`}
    >
      <div className="container mx-auto py-2 sm:py-3">
        <nav className="flex items-center text-xs sm:text-sm rounded-lg px-2 sm:px-3 lg:px-4 py-2 sm:py-3 overflow-x-auto">
          {/* Home Link */}
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-primaryColor hover:bg-primaryColor/5 transition-all duration-200 rounded-md px-1 sm:px-2 py-1 group flex-shrink-0"
          >
            <div className="p-0.5 sm:p-1 rounded-md bg-gray-100 group-hover:bg-primaryColor/10 transition-colors mr-1 sm:mr-2">
              <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </div>
            <span className="font-medium">Home</span>
          </Link>

          {/* Dynamic Breadcrumb Items */}
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {/* Separator */}
              <div className="flex items-center mx-1 sm:mx-2 flex-shrink-0">
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />
              </div>

              {/* Breadcrumb Item */}
              {item.href && !item.isActive ? (
                <Link
                  href={item.href}
                  className="flex items-center text-gray-600 hover:text-primaryColor hover:bg-primaryColor/5 transition-all duration-200 rounded-md px-1 sm:px-2 py-1 group flex-shrink-0 min-w-0"
                >
                  {item.icon && (
                    <div className="p-0.5 sm:p-1 rounded-md bg-gray-100 group-hover:bg-primaryColor/10 transition-colors mr-1 sm:mr-2 flex-shrink-0">
                      {item.icon}
                    </div>
                  )}
                  <span className="font-medium truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center text-gray-900 px-1 sm:px-2 py-1 min-w-0 flex-1">
                  {item.icon && (
                    <div className="p-0.5 sm:p-1 rounded-md bg-primaryColor/10 mr-1 sm:mr-2 flex-shrink-0">
                      {item.icon}
                    </div>
                  )}
                  <span className="font-semibold text-gray-900 truncate">
                    {item.label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
