import { fetchDataPagination, fetchProtectedData } from "@/utils/api-utils";
import {
  CouponUsageLog,
  CouponUsageStats,
  PaginatedResponse,
} from "@/utils/types";

export interface UsageLogDateRange {
  /** ISO date (yyyy-mm-dd), inclusive. */
  fromDate?: string;
  /** ISO date (yyyy-mm-dd), inclusive. */
  toDate?: string;
}

/** Builds the shared `page`/`limit` plus optional date-range query string. */
function logQuery(
  page: number,
  limit: number,
  { fromDate, toDate }: UsageLogDateRange = {}
): string {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  return params.toString();
}

/**
 * Get all coupon usage logs (server-side paginated)
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @param range - Optional inclusive date range
 * @returns Promise<PaginatedResponse<CouponUsageLog>>
 */
export async function getAllCouponUsageLogs(
  page = 1,
  limit = 10,
  range: UsageLogDateRange = {}
): Promise<PaginatedResponse<CouponUsageLog>> {
  // fetchDataPagination returns the full envelope (data, total, totalPages);
  // fetchProtectedData would unwrap it to just the rows array.
  return fetchDataPagination<PaginatedResponse<CouponUsageLog>>(
    `coupon-usage-logs?${logQuery(page, limit, range)}`
  );
}

/**
 * Get coupon usage logs by coupon code (server-side paginated)
 * @param couponCode - The coupon code to filter logs by
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @param range - Optional inclusive date range
 * @returns Promise<PaginatedResponse<CouponUsageLog>>
 */
export async function getCouponUsageLogsByCode(
  couponCode: string,
  page = 1,
  limit = 10,
  range: UsageLogDateRange = {}
): Promise<PaginatedResponse<CouponUsageLog>> {
  return fetchDataPagination<PaginatedResponse<CouponUsageLog>>(
    `coupon-usage-logs/coupon/${encodeURIComponent(couponCode)}?${logQuery(
      page,
      limit,
      range
    )}`
  );
}

/**
 * Get coupon usage statistics by coupon code
 * @param couponCode - The coupon code to get stats for
 * @returns Promise<CouponUsageStats>
 */
export async function getCouponUsageStats(
  couponCode: string
): Promise<CouponUsageStats> {
  try {
    const response = await fetchProtectedData<CouponUsageStats>(
      `coupon-usage-logs/stats/${encodeURIComponent(couponCode)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching coupon usage stats:", error);
    throw error;
  }
}

/**
 * Get a single coupon usage log by ID
 * @param id - The usage log ID
 * @returns Promise<CouponUsageLog>
 */
export async function getCouponUsageLogById(
  id: number | string
): Promise<CouponUsageLog> {
  try {
    const response = await fetchProtectedData<CouponUsageLog>(
      `coupon-usage-logs/${id}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching coupon usage log by ID:", error);
    throw error;
  }
}
