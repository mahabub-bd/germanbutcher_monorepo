'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function SearchForm({
  initialQuery = '',
}: {
  initialQuery?: string;
}) {
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input with cleanup
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      if (localQuery !== initialQuery) {
        if (localQuery) {
          router.push(
            `/recipes?recipesearch=${encodeURIComponent(localQuery)}`
          );
        } else {
          router.push('/recipes');
        }
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localQuery, router, initialQuery]);

  useEffect(() => {
    if (initialQuery !== localQuery) {
      setLocalQuery(initialQuery || '');
    }
  }, [initialQuery]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value || '';
      setLocalQuery(value);
    },
    []
  );

  const handleSearchClick = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (localQuery) {
      router.push(`/recipes?recipesearch=${encodeURIComponent(localQuery)}`);
    } else {
      router.push('/recipes');
    }
  }, [localQuery, router]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    router.push('/recipes');
  }, [router]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearchClick();
      }
    },
    [handleSearchClick]
  );

  return (
    <div className="w-full px-4 sm:px-6 md:px-0 max-w-2xl mx-auto mb-8">
      <div className="relative">
        <Input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="md:py-6 sm:py-4 px-5 sm:px-6 rounded-2xl border-3 border-primaryColor/70 w-full text-primaryColor/70 font-medium text-sm sm:text-base lg:text-lg placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:ring-2 focus:ring-primary  placeholder-red-300 focus:border-transparent"
          placeholder="Search your favorite recipe"
        />
        <Button
          type="button"
          onClick={handleSearchClick}
          className="absolute top-0 right-0 bg-primaryColor text-primary-foreground px-10 sm:px-10 h-full rounded-r-2xl flex items-center justify-center hover:bg-primaryColor/90 transition-colors rounded-l-none"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Active Search Filter */}
      {localQuery && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active search:</span>

          <div className="flex items-center gap-1 bg-muted text-foreground px-3 py-1 rounded-full text-sm">
            <span>Search: {localQuery}</span>
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="ml-1 hover:bg-background/20 rounded-full p-0.5 transition-colors h-auto "
              aria-label="Clear search filter"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <Button
            onClick={handleClear}
            variant="link"
            size="sm"
            className="text-sm text-destructive hover:text-destructive/80 underline transition-colors p-0 h-auto"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}
