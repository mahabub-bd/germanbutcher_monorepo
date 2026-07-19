import { fetchProtectedData } from "@/utils/api-utils";
import { CouponUsageLog, CouponUsageStats } from "@/utils/types";

/**
 * Get all coupon usage logs
 * @returns Promise<CouponUsageLog[]>
 */
export async function getAllCouponUsageLogs(): Promise<CouponUsageLog[]> {
  try {
    const response = await fetchProtectedData<CouponUsageLog[]>(
      "coupon-usage-logs"
    );
    return response;
  } catch (error) {
    console.error("Error fetching all coupon usage logs:", error);
    throw error;
  }
}

/**
 * Get coupon usage logs by coupon code
 * @param couponCode - The coupon code to filter logs by
 * @returns Promise<CouponUsageLog[]>
 */
export async function getCouponUsageLogsByCode(
  couponCode: string
): Promise<CouponUsageLog[]> {
  try {
    const response = await fetchProtectedData<CouponUsageLog[]>(
      `coupon-usage-logs/coupon/${encodeURIComponent(couponCode)}`
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
