"use client";

import { SearchContext } from "@/contexts/search-context";
import { useContext } from "react";

export function useGlobalSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useGlobalSearch must be used within a SearchProvider");
  }
  return context;
}
