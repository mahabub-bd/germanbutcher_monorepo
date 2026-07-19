import { Product } from "@/utils/types";
import { createContext } from "react";

interface SearchContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  products: Product[];
  loading: boolean;
  error: string | null;
  handleSearch: (query: string) => void;
  clearSearch: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(
  undefined
);
