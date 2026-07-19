import type { Product } from "@/utils/types";
import { ChevronRight, Home, Package2, Tag } from "lucide-react";
import Link from "next/link";

interface ProductBreadcrumbProps {
  product: Product;
}

export function ProductBreadcrumb({ product }: ProductBreadcrumbProps) {
  return (
    <div className="  sticky top-0 z-10 ">
      <div className="container mx-auto  py-2 sm:py-3 lg:py-4">
        <nav className="flex items-center text-xs sm:text-sm  rounded-lg  overflow-x-auto">
          {/* Home Link */}
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-primaryColor hover:bg-primaryColor/5 transition-all duration-200 rounded-md px-1 sm:px-2 py-1 group flex-shrink-0"
          >
            <div className="p-0.5 sm:p-1 rounded-md bg-gray-100 group-hover:bg-primaryColor/10 transition-colors mr-1 sm:mr-2">
              <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </div>
            <span className="font-medium hidden sm:inline">Home</span>
            <span className="font-medium sm:hidden">Home</span>
          </Link>

          {/* Separator */}
          <div className="flex items-center mx-1 sm:mx-2 flex-shrink-0">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />
          </div>

          {/* Category Link */}
          <Link
            href={`/categories/${product.category.slug}`}
            className="flex items-center text-gray-600 hover:text-primaryColor hover:bg-primaryColor/5 transition-all duration-200 rounded-md px-1 sm:px-2 py-1 group flex-shrink-0 min-w-0"
          >
            <div className="p-0.5 sm:p-1 rounded-md bg-gray-100 group-hover:bg-primaryColor/10 transition-colors mr-1 sm:mr-2 flex-shrink-0">
              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </div>
            <span className="font-medium truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none">
              {product.category.name}
            </span>
          </Link>

          {/* Separator */}
          <div className="flex items-center mx-1 sm:mx-2 flex-shrink-0">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />
          </div>

          {/* Current Product */}
          <div className="flex items-center text-gray-900 px-1 sm:px-2 py-1 min-w-0 flex-1">
            <div className="p-0.5 sm:p-1 rounded-md bg-primaryColor/10 mr-1 sm:mr-2 flex-shrink-0">
              <Package2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primaryColor" />
            </div>
            <span className="font-semibold text-gray-900 truncate">
              {product.name}
            </span>
          </div>
        </nav>
      </div>
    </div>
  );
}
