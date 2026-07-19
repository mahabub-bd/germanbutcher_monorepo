"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { useGlobalSearch } from "@/hooks/use-global-search";
import type { Product } from "@/utils/types";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect } from "react"; // ✅ Add this import
import { EmptySearchState } from "./empty-search-state";
import { ProductSearchItem } from "./product-search-item";

export function SearchModal() {
  const {
    isOpen,
    setIsOpen,
    searchQuery,
    products,
    loading,
    error,
    clearSearch,
  } = useGlobalSearch();

  const pathname = usePathname();

  useEffect(() => {
    if (isOpen && !searchQuery.trim()) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 300); // 300ms delay

      return () => clearTimeout(timer);
    }
  }, [searchQuery, isOpen, setIsOpen]);

  const shouldShowModal = () => {
    const adminRoutes = ["/admin"];
    const isAdminRoute = adminRoutes.some((route) =>
      pathname.startsWith(route)
    );

    const excludedRoutes = ["/login", "/register", "/checkout"];
    const isExcludedRoute = excludedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    return !isAdminRoute && !isExcludedRoute;
  };

  // Don't render if modal shouldn't show on this route
  if (!shouldShowModal() || !isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const displayedProducts = products.slice(0, 4);
  const hasMoreProducts = products.length > 4;

  return (
    <div
      className="fixed inset-0 z-100  flex items-start justify-center md:pt-28 pt-22 px-4 "
      onClick={handleBackdropClick}
    >
      {/* Rest of your modal JSX remains the same */}
      <div className="bg-white rounded-sm shadow-2xl xl:w-160 lg:w-80 w-96 max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results
              </h2>
              {searchQuery && (
                <p className="text-sm text-gray-500">
                  for &quot;{searchQuery}&quot;
                  {products.length > 0 && (
                    <span className="ml-1 text-blue-600 font-medium">
                      ({products.length}{" "}
                      {products.length === 1 ? "result" : "results"})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading && <LoadingIndicator message="Searching products..." />}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-gray-600 font-medium mb-1">Search Error</p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && products.length === 0 && searchQuery && (
            <EmptySearchState searchQuery={searchQuery} />
          )}

          {!loading && displayedProducts.length > 0 && (
            <div className="p-4">
              <div className="space-y-2">
                {displayedProducts.map((product: Product) => (
                  <ProductSearchItem
                    key={product.id}
                    product={product}
                    onClose={handleClose}
                  />
                ))}
              </div>

              {/* View All Results Link */}
              {hasMoreProducts && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link
                    href={`/products/search/${encodeURIComponent(searchQuery)}`}
                    onClick={handleClose}
                    className="flex items-center justify-center w-full py-2 px-4 bg-gradient-to-r from-primaryColor to-secondaryColor hover:from-secondaryColor hover:to-primaryColor text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg group"
                  >
                    <span>View All {products.length} Results</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
