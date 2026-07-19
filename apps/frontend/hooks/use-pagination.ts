"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  totalItems?: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  totalItems = 0,
}: UsePaginationProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(
    Number.parseInt(searchParams.get("page") || initialPage.toString())
  );
  const [limit, setLimit] = useState(
    Number.parseInt(searchParams.get("limit") || initialLimit.toString())
  );
  const [totalPages, setTotalPages] = useState(
    Math.max(1, Math.ceil(totalItems / limit))
  );

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(totalItems / limit)));
  }, [totalItems, limit]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    router.replace(`?${params.toString()}`);
  }, [currentPage, limit, router, searchParams]);

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);

    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    limit,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
  };
}
