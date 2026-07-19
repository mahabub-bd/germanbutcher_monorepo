'use client';

import { Search, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RecipeSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  categoryName: string;
  onClearCategory: () => void;
  onClearAll: () => void;
}

export default function RecipeSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  categoryName,
  onClearCategory,
  onClearAll,
}: RecipeSearchProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input with cleanup
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 500); // Increased debounce time for better UX

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearch, onSearchChange, searchQuery]);

  // Sync local search with prop changes
  useEffect(() => {
    if (searchQuery !== localSearch) {
      setLocalSearch(searchQuery || '');
    }
  }, [searchQuery]); // Removed localSearch from deps to prevent infinite loop

  const hasFilters = searchQuery || selectedCategory;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value || '';
      setLocalSearch(value);
    },
    []
  );

  const handleSearchClick = useCallback(() => {
    // Force immediate search without waiting for debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearchChange(localSearch || '');
  }, [localSearch, onSearchChange]);

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
  }, [onSearchChange]);

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearchClick();
      }
    },
    [handleSearchClick]
  );

  return (
    <div className="w-full px-4 sm:px-6 md:px-0 max-w-2xl mx-auto mt-8 sm:mt-10 md:mt-14 lg:mt-28">
      <div className="relative">
        <input
          type="text"
          value={localSearch}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="py-3 sm:py-4 px-5 sm:px-6 rounded-2xl border border-black/20 w-full text-black/70 font-medium text-sm sm:text-base lg:text-lg placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:ring-2 focus:ring-secondaryColor focus:border-transparent"
          placeholder="Search your favorite recipe"
        />
        <button
          className="absolute w-lg top-0 cursor-pointer right-0 bg-secondaryColor text-whiteColor px-5 sm:px-7 h-full rounded-r-2xl flex items-center justify-center hover:bg-secondaryColor/90 transition-colors"
          type="button"
          onClick={handleSearchClick}
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Active Filters */}
      {hasFilters ? (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>

          {selectedCategory && (
            <div className="flex items-center gap-1 bg-secondaryColor text-white px-3 py-1 rounded-full text-sm">
              <span>Category: {categoryName || selectedCategory}</span>
              <button
                onClick={onClearCategory}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                type="button"
                aria-label="Clear category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {searchQuery && (
            <div className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1 rounded-full text-sm">
              <span>Search: {searchQuery}</span>
              <button
                onClick={handleClearSearch}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                type="button"
                aria-label="Clear search filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={onClearAll}
            className="text-sm text-red-600 hover:text-red-800 underline transition-colors"
            type="button"
          >
            Clear all
          </button>
        </div>
      ) : (
        <div className="mt-4 text-center text-sm text-gray-500">
          Search for recipes or select a category below to get started
        </div>
      )}
    </div>
  );
}
