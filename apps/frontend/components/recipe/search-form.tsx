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
    <div className="w-full px-4 sm:px-6 md:px-0 max-w-xl mx-auto mb-8 pt-4 md:pt-10">
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />

        <Input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="h-11 rounded-full pl-11 bg-white border border-gray-200 shadow-sm w-full text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primaryColor/20 focus:border-primaryColor transition-all duration-200 hover:border-gray-300"
          placeholder="Search your favorite recipe"
        />

        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label='Clear search'
          >
            <X className='w-4 h-4' />
          </button>
        )}

        <button
          type='button'
          onClick={handleSearchClick}
          className='absolute right-1.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-primaryColor text-white transition-colors hover:bg-secondaryColor'
          aria-label='Search'
        >
          <Search className='size-4' />
        </button>
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
