"use client";
import { SearchContext } from "@/contexts/search-context";
import { fetchData } from "@/utils/api-utils";
import { Product } from "@/utils/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const fetchAbortController = useRef<AbortController | null>(null);

  // Initialize search query from URL on mount only
  useEffect(() => {
    if (isInitialMount.current) {
      const query = searchParams.get("search");
      if (query) {
        setSearchQuery(query);
        setIsOpen(true);
      }
      isInitialMount.current = false;
    }
  }, []);

  // Fetch products based on search query with debounce
  useEffect(() => {
    // Cancel previous fetch if exists
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }

    if (!searchQuery.trim()) {
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      // Create new abort controller for this fetch
      fetchAbortController.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const data = await fetchData<Product[]>(
          `products?search=${encodeURIComponent(searchQuery.trim())}&isActive=true`
        );

        // Only update if not aborted
        if (!fetchAbortController.current.signal.aborted) {
          setProducts(data || []);
          setIsOpen(true);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        if (!fetchAbortController.current?.signal.aborted) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setProducts([]);
        }
      } finally {
        if (!fetchAbortController.current?.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);

    return () => {
      clearTimeout(timeoutId);
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
    };
  }, [searchQuery]);

  // Only update URL when explicitly calling handleSearch (like on Enter key)
  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        const params = new URLSearchParams();
        params.set("search", query.trim());
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    },
    [router]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsOpen(false);
    setIsExpanded(false);
    setProducts([]);
    setError(null);

    // Cancel any ongoing fetch
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }

    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  return (
    <SearchContext.Provider
      value={{
        isOpen,
        setIsOpen,
        searchQuery,
        setSearchQuery,
        products,
        loading,
        error,
        handleSearch,
        clearSearch,
        isExpanded,
        setIsExpanded,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
