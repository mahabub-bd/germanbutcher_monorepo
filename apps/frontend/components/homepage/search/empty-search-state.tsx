"use client";

import { Search } from "lucide-react";

interface EmptySearchStateProps {
  searchQuery: string;
}

export function EmptySearchState({ searchQuery }: EmptySearchStateProps) {
  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-gray-400" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No products found
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn&quot;t find any products matching &quot;{searchQuery}&quot;.
          Try adjusting your search terms or explore our suggestions below.
        </p>
      </div>
    </div>
  );
}
