import { fetchProtectedData } from "@/utils/api-utils";
import {
  CouponUsageLog,
  CouponUsageStats,
  PaginatedResponse,
} from "@/utils/types";

/**
 * Get all coupon usage logs (server-side paginated)
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @returns Promise<PaginatedResponse<CouponUsageLog>>
 */
export async function getAllCouponUsageLogs(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<CouponUsageLog>> {
  try {
    const response = await fetchProtectedData<
      PaginatedResponse<CouponUsageLog>
    >(`coupon-usage-logs?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error("Error fetching all coupon usage logs:", error);
    throw error;
  }
}

/**
 * Get coupon usage logs by coupon code (server-side paginated)
 * @param couponCode - The coupon code to filter logs by
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @returns Promise<PaginatedResponse<CouponUsageLog>>
 */
export async function getCouponUsageLogsByCode(
  couponCode: string,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<CouponUsageLog>> {
  try {
    const response = await fetchProtectedData<
      PaginatedResponse<CouponUsageLog>
    >(
      `coupon-usage-logs/coupon/${encodeURIComponent(couponCode)}?page=${page}&limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching coupon usage logs by code:", error);
    throw error;
  }
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
