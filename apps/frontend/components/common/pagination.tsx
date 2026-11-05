'use client';

import type React from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  paginationUrls?: Record<number, string>;
  onPageChange?: (page: number) => void;
}

// Bordered rounded-square buttons per the mockup: white card tiles for idle
// pages/arrows, solid primaryColor square for the active page. bg-none!
// kills the base gradient so the solid fill shows; the postfix-! overrides
// neutralize the base hover scale/shadow (scrollbar flicker) as before.
const BTN =
  'min-h-10 min-w-10 rounded-xl border border-border bg-card p-0 text-sm font-semibold text-foreground hover:scale-100! active:scale-100! hover:bg-muted! hover:text-foreground! sm:h-10 sm:min-h-0 sm:min-w-0 sm:w-10';
const BTN_ACTIVE =
  'bg-primaryColor bg-none! border-primaryColor text-white! hover:bg-primaryColor/90! hover:text-white!';
const BTN_ARROW =
  'min-h-10 min-w-10 gap-0 rounded-xl border border-border bg-card p-0 text-foreground hover:scale-100! active:scale-100! hover:bg-muted! hover:text-foreground! sm:h-10 sm:min-h-0 sm:min-w-0 sm:w-10';
const BTN_ARROW_DISABLED = 'pointer-events-none opacity-40';
// Ellipsis is non-interactive — no border, keeps the base hover off.
const ELLIPSIS =
  'min-h-10 min-w-7 border-0 bg-transparent p-0 text-muted-foreground hover:text-muted-foreground! sm:h-10 sm:min-h-0 sm:min-w-0 sm:w-7';

/**
 * GitHub-style page window: always shows first/last page and the current
 * neighbourhood (±1 pages), collapsing the gaps with a single,
 * non-duplicating ellipsis.
 */
function buildPageWindow(current: number, total: number): (number | null)[] {
  if (total <= 0) return [];

  // Small totals fit entirely — no ellipsis needed.
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  const items: (number | null)[] = [1];
  if (left > 2) items.push(null); // ellipsis after page 1
  for (let p = left; p <= right; p++) items.push(p);
  if (right < total - 1) items.push(null); // ellipsis before last page
  items.push(total);
  return items;
}

export function PaginationComponent({
  currentPage,
  totalPages,
  baseUrl = '?page=',
  paginationUrls,
  onPageChange,
}: PaginationComponentProps) {
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  // One shared window for every breakpoint — first/last page plus the current
  // neighbourhood (±1). On mobile the strip becomes horizontally scrollable
  // and self-centers the active page, so nothing has to be dropped.
  const pageWindow = useMemo(
    () => buildPageWindow(safePage, totalPages),
    [safePage, totalPages]
  );

  // Center the active page on mount and whenever it changes, but only when
  // the strip actually overflows (i.e. on mobile widths).
  const contentRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const strip = contentRef.current;
    const active = activeRef.current;
    if (!strip || !active) return;
    if (strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({
      left:
        active.offsetLeft -
        strip.clientWidth / 2 +
        active.clientWidth / 2,
      behavior: 'smooth',
    });
  }, [safePage, totalPages]);

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

  const prevDisabled = safePage <= 1;
  const nextDisabled = safePage >= totalPages;

  const renderWindow = (window: (number | null)[]): React.ReactNode =>
    window.map((item, index) => {
      if (item === null) {
        return (
          <PaginationItem key={`gap-${index}`} className="shrink-0">
            <PaginationEllipsis className={ELLIPSIS} />
          </PaginationItem>
        );
      }

      const isActive = item === safePage;
      return (
        <PaginationItem
          key={item}
          ref={isActive ? activeRef : undefined}
          className="shrink-0"
        >
          <PaginationLink
            href={getPageUrl(item)}
            isActive={isActive}
            onClick={(e) => handleClick(item, e)}
            className={cn(BTN, isActive && BTN_ACTIVE)}
          >
            {item}
          </PaginationLink>
        </PaginationItem>
      );
    });

  return (
    <Pagination className="mx-0 w-auto justify-center md:justify-end">
      {/* Single strip for every breakpoint. On very narrow screens it scrolls
          horizontally; scrollbar-none (not scrollbar-hide, which reserves
          classic-scrollbar space and causes row shift on hover) keeps the
          strip jump-free. Desktop never overflows: window is capped at 7. */}
      <PaginationContent
        ref={contentRef}
        className="scrollbar-none max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-lg bg-transparent p-0 backdrop-blur-none [-webkit-overflow-scrolling:touch]"
      >
        {/* Jump-to-first — visible once there is room for it to matter */}
        {totalPages > 2 && (
          <PaginationItem className="shrink-0">
            <PaginationLink
              aria-label="Go to first page"
              href={safePage > 1 ? getPageUrl(1) : undefined}
              aria-disabled={safePage <= 1}
              tabIndex={safePage <= 1 ? -1 : undefined}
              className={`${BTN_ARROW} ${safePage <= 1 ? BTN_ARROW_DISABLED : ''}`}
              onClick={(e) => safePage > 1 && handleClick(1, e)}
            >
              <ChevronsLeft className="size-4" />
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Icon-only prev/next — the page numbers carry the labels, keeping
            the footer strip compact on mobile. */}
        <PaginationItem className="shrink-0">
          <PaginationLink
            aria-label="Go to previous page"
            href={prevDisabled ? undefined : getPageUrl(safePage - 1)}
            aria-disabled={prevDisabled}
            tabIndex={prevDisabled ? -1 : undefined}
            className={`${BTN_ARROW} ${prevDisabled ? BTN_ARROW_DISABLED : ''}`}
            onClick={(e) => safePage > 1 && handleClick(safePage - 1, e)}
          >
            <ChevronLeft className="size-4" />
          </PaginationLink>
        </PaginationItem>

        {renderWindow(pageWindow)}

        {/* Jump-to-last */}
        {totalPages > 2 && (
          <PaginationItem className="shrink-0">
            <PaginationLink
              aria-label="Go to last page"
              href={safePage < totalPages ? getPageUrl(totalPages) : undefined}
              aria-disabled={safePage >= totalPages}
              tabIndex={safePage >= totalPages ? -1 : undefined}
              className={`${BTN_ARROW} ${safePage >= totalPages ? BTN_ARROW_DISABLED : ''}`}
              onClick={(e) => safePage < totalPages && handleClick(totalPages, e)}
            >
              <ChevronsRight className="size-4" />
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Next */}
        <PaginationItem className="shrink-0">
          <PaginationLink
            aria-label="Go to next page"
            href={nextDisabled ? undefined : getPageUrl(safePage + 1)}
            aria-disabled={nextDisabled}
            tabIndex={nextDisabled ? -1 : undefined}
            className={`${BTN_ARROW} ${nextDisabled ? BTN_ARROW_DISABLED : ''}`}
            onClick={(e) =>
              safePage < totalPages && handleClick(safePage + 1, e)
            }
          >
            <ChevronRight className="size-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
