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
          className="pl-10 pr-10 py-1 xl:w-75 lg:w-48 md:w-72 xs:w-62 w-60 md:px-12 md:py-2  bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primaryColor text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
