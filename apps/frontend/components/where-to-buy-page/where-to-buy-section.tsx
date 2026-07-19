"use client";

import { bangladeshData } from "@/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchDataPagination } from "@/utils/api-utils";
import { SalesPoint } from "@/utils/types";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingIndicator } from "../admin/loading-indicator";
import { PaginationComponent } from "../common/pagination";
import { SalesPointCard } from "./sales-point-card";

export interface ApiResponse {
  message: string;
  statusCode: number;
  data: SalesPoint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchParams {
  page?: string;
  shopSearch?: string;
  division?: string;
  district?: string;
}

interface WhereToBuyClientProps {
  initialData: ApiResponse;
  searchParams: SearchParams;
}

function WhereToBuyClient({
  initialData,
  searchParams,
}: WhereToBuyClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const isInitialMount = useRef(true);

  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>(
    initialData.data
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);

  const [currentPage, setCurrentPage] = useState(Number(initialData.page));

  const [shopSearch, setShopSearch] = useState(
    Array.isArray(searchParams.shopSearch)
      ? searchParams.shopSearch[0] || ""
      : searchParams.shopSearch || ""
  );
  const [division, setDivision] = useState(
    Array.isArray(searchParams.division)
      ? searchParams.division[0] || ""
      : searchParams.division || ""
  );
  const [district, setDistrict] = useState(
    Array.isArray(searchParams.district)
      ? searchParams.district[0] || ""
      : searchParams.district || ""
  );

  const divisions = Object.keys(bangladeshData);
  const districts = division
    ? bangladeshData[division as keyof typeof bangladeshData] || []
    : [];

  const debouncedShopSearch = useDebounce(shopSearch, 300);

  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(urlSearchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });

      router.push(`?${newParams.toString()}`);
    },
    [router, urlSearchParams]
  );

  const fetchSalesPoints = useCallback(
    async (params: Record<string, string>, showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value) {
            searchParams.set(key, value);
          }
        });

        searchParams.set("isActive", "true");

        const data = (await fetchDataPagination(
          `sales-points?${searchParams.toString()}`
        )) as ApiResponse;

        setSalesPoints(data.data);
        setTotalPages(data.totalPages);

        setCurrentPage(Number(data.page));
      } catch (error) {
        console.error("Error fetching sales points:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch sales points"
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
   
    if (isInitialMount.current) {
      isInitialMount.current = false;


      const hasUrlParams = debouncedShopSearch || division || district;
      const hasInitialParams =
        searchParams.shopSearch ||
        searchParams.division ||
        searchParams.district;

      if (hasUrlParams && !hasInitialParams) {
        const params = {
          page: "1",
          shopSearch: debouncedShopSearch,
          division,
          district,
        };

        updateURL(params);
        fetchSalesPoints(params);
      }
      return;
    }

    const params = {
      page: "1",
      shopSearch: debouncedShopSearch,
      division,
      district,
    };

    updateURL(params);
    fetchSalesPoints(params);
  }, [debouncedShopSearch, division, district, updateURL, fetchSalesPoints]);

  const handlePageChange = (page: number) => {
    const params = {
      page: page.toString(),
      shopSearch: debouncedShopSearch,
      division,
      district,
    };

    updateURL(params);
    fetchSalesPoints(params);
  };

  const clearFilters = () => {
    setShopSearch("");
    setDivision("");
    setDistrict("");

    const params = {
      page: "1",
      shopSearch: "",
      division: "",
      district: "",
    };

    router.push("?");
    fetchSalesPoints(params);
  };

  const handleDivisionChange = (selectedDivision: string) => {
    setDivision(selectedDivision);
    setDistrict("");
  };

  const hasActiveFilters = shopSearch || division || district;

  return (
    <>
      {/* Modern Search and Filter Form */}
      <div className="bg-white/95 backdrop-blur-md rounded-md shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/30">
        <div className="flex flex-col gap-5">
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                placeholder="Search locations..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primaryColor/30 focus:border-primaryColor transition-all text-sm sm:text-base text-gray-800 placeholder-gray-400 bg-white/80 backdrop-blur-sm hover:bg-white/90"
              />
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              {shopSearch && (
                <button
                  type="button"
                  onClick={() => setShopSearch("")}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Division Field */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                Division
              </label>
              <div className="relative">
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-3  sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-8 sm:pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primaryColor/30 focus:border-primaryColor transition-all text-sm sm:text-base text-gray-800 appearance-none cursor-pointer bg-white/80 backdrop-blur-sm hover:bg-white/90"
                >
                  <option value="">Select Division</option>
                  {divisions.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* District Field */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                District
              </label>
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!division}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-8 sm:pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primaryColor/30 focus:border-primaryColor transition-all text-sm sm:text-base text-gray-800 appearance-none cursor-pointer bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:bg-gray-50/80 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <option value="">Select District</option>
                  {districts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters and Clear Button */}
        {hasActiveFilters && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t border-gray-200/60 mt-4 sm:mt-6 space-y-3 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                Active Filters:
              </span>

              {shopSearch && (
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-primaryColor/20 to-primaryColor/10 text-primaryColor border border-primaryColor/20">
                  <span className="hidden sm:inline">Search: </span>
                  <span className="max-w-[80px] sm:max-w-none truncate">
                    {shopSearch}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShopSearch("")}
                    className="ml-1 sm:ml-2 hover:text-primaryColor/70 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </span>
              )}

              {division && (
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-700 border border-blue-500/20">
                  <span className="max-w-[80px] sm:max-w-none truncate">
                    {division}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDivisionChange("")}
                    className="ml-1 sm:ml-2 hover:text-blue-700/70 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </span>
              )}

              {district && (
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-700 border border-green-500/20">
                  <span className="max-w-[80px] sm:max-w-none truncate">
                    {district}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDistrict("")}
                    className="ml-1 sm:ml-2 hover:text-green-700/70 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all font-medium flex items-center border border-gray-200 shadow-sm text-xs sm:text-sm self-start sm:self-center"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Clear All</span>
              <span className="xs:hidden">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && <LoadingIndicator message="Loading Search Data " />}

      {/* Error State */}
      {error && (
        <div className="text-center py-10">
          <div className="bg-red-50 rounded-md p-6 border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Sales Points Grid */}
      {!loading && !error && (
        <div className="grid gap-8">
          {salesPoints.map((salesPoint: SalesPoint) => (
            <SalesPointCard key={salesPoint.id} salesPoint={salesPoint} />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && salesPoints.length === 0 && (
        <div className="text-center py-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-xl p-12 mx-auto border border-white/20">
            <div className="text-gray-300 text-8xl mb-6">🏪</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No locations found
            </h3>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Try adjusting your search criteria to find what you&apos;re
              looking for.
            </p>
            <button
              onClick={clearFilters}
              className="px-8 py-3 bg-gradient-to-r from-primaryColor to-primaryColor/90 text-white rounded-xl hover:from-primaryColor/90 hover:to-primaryColor/80 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl=""
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </>
  );
}

export { WhereToBuyClient };
