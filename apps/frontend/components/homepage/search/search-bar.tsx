"use client";

import { Input } from "@/components/ui/input";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { Search, X } from "lucide-react";
import type React from "react";
import { useCallback, useId, useRef } from "react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchBar({
  placeholder = "Search Here",
  className = "",
  disabled = false,
}: SearchBarProps) {
  const { searchQuery, setSearchQuery, handleSearch, clearSearch } =
    useGlobalSearch();
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const value = e.target.value;

      setSearchQuery(value);
    },
    [setSearchQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          clearSearch();
          inputRef.current?.blur();
          break;
        case "Enter":
          e.preventDefault();
          if (searchQuery.trim()) {
            handleSearch(searchQuery);
          }
          break;
      }
    },
    [clearSearch, searchQuery, handleSearch]
  );

  const handleClearSearch = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      clearSearch();
      inputRef.current?.focus();
    },
    [clearSearch]
  );

  const hasSearchQuery = Boolean(searchQuery?.trim());

  return (
    <div className={`relative group ${className}`}>
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primaryColor transition-colors pointer-events-none"
          aria-hidden="true"
        />

        <Input
          ref={inputRef}
          id={searchId}
          type="text"
          role="searchbox"
          placeholder={placeholder}
          value={searchQuery || ""}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-9 rounded-full pl-9 pr-10 bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryColor/20 focus:border-primaryColor text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed w-60 md:w-64 xl:w-80"
          autoComplete="off"
          spellCheck="false"
          aria-label="Search input"
          aria-describedby={hasSearchQuery ? `${searchId}-clear` : undefined}
        />

        {hasSearchQuery && (
          <button
            id={`${searchId}-clear`}
            type="button"
            onClick={handleClearSearch}
            disabled={disabled}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (searchQuery?.trim()) handleSearch(searchQuery);
          }}
          disabled={disabled}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-primaryColor text-white transition-colors hover:bg-secondaryColor focus:outline-none focus:ring-2 focus:ring-primaryColor/40 disabled:opacity-50"
          aria-label="Search"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
