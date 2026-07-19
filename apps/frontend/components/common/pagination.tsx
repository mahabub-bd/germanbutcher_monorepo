'use client';

import type React from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useEffect, useMemo, useState } from 'react';

interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  paginationUrls?: Record<number, string>;
  onPageChange?: (page: number) => void;
}

export function PaginationComponent({
  currentPage,
  totalPages,
  baseUrl = '?page=',
  paginationUrls,
  onPageChange,
}: PaginationComponentProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visiblePages = useMemo(() => {
    // Reduce siblings on mobile devices
    const siblingsCount = isMobile ? 0 : 1;

    const pages = new Set<number>();

    for (
      let i = Math.max(1, currentPage - siblingsCount);
      i <= Math.min(totalPages, currentPage + siblingsCount);
      i++
    ) {
      pages.add(i);
    }

    pages.add(1);
    if (totalPages > 0) {
      pages.add(totalPages);
    }

    return Array.from(pages).sort((a, b) => a - b);
  }, [currentPage, totalPages, isMobile]);

  const getPageUrl = (page: number): string => {
    if (paginationUrls && paginationUrls[page]) {
      return paginationUrls[page];
    }
    return `${baseUrl}${page}`;
  };

  const handleClick = (page: number, e: React.MouseEvent) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  };

  return (
    <Pagination className="justify-center md:justify-end">
      <PaginationContent className="flex-wrap gap-1">
        {/* Previous Button */}
        <PaginationItem>
          <PaginationPrevious
            href={currentPage <= 1 ? undefined : getPageUrl(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            className={
              currentPage <= 1
                ? 'pointer-events-none opacity-50 cursor-pointer h-8 w-8 p-0 md:h-10 md:w-auto md:px-4 md:py-2'
                : 'h-8 w-8 p-0 md:h-10 md:w-auto md:px-4 md:py-2'
            }
            onClick={(e) => currentPage > 1 && handleClick(currentPage - 1, e)}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          const needsEllipsisBefore = previousPage && page - previousPage > 1;

          return (
            <div key={page} className="flex items-center cursor-pointer">
              {needsEllipsisBefore && (
                <PaginationItem>
                  <PaginationEllipsis className="h-8 w-8 md:h-10 md:w-10" />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  href={getPageUrl(page)}
                  isActive={page === currentPage}
                  onClick={(e) => handleClick(page, e)}
                  className="h-8 w-8 p-0 md:h-10 md:w-10"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            </div>
          );
        })}

        {/* Next Button */}
        <PaginationItem>
          <PaginationNext
            href={
              currentPage >= totalPages
                ? undefined
                : getPageUrl(currentPage + 1)
            }
            aria-disabled={currentPage >= totalPages}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
            className={
              currentPage >= totalPages
                ? 'pointer-events-none opacity-50 cursor-pointer h-8 w-8 p-0 md:h-10 md:w-auto md:px-4 md:py-2'
                : 'h-8 w-8 p-0 md:h-10 md:w-auto md:px-4 md:py-2'
            }
            onClick={(e) =>
              currentPage < totalPages && handleClick(currentPage + 1, e)
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
