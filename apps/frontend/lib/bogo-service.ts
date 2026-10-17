import {
  deleteData,
  fetchDataPagination,
  fetchProtectedData,
  patchData,
  postData,
} from "@/utils/api-utils";
import type {
  BogoCampaign,
  BogoPreviewResult,
  BogoUsageLog,
} from "@/utils/types";

/** All BOGO campaigns for the admin list. */
export function getAllBogoCampaigns(): Promise<BogoCampaign[]> {
  return fetchProtectedData<BogoCampaign[]>("bogo-campaigns");
}

/** One campaign (admin summary with trimmed product/category relations). */
export function getBogoCampaignById(
  id: string | number
): Promise<BogoCampaign> {
  return fetchProtectedData<BogoCampaign>(`bogo-campaigns/${id}`);
}

export function createBogoCampaign(
  payload: Partial<BogoCampaign> & {
    validFrom?: string;
    validUntil?: string;
    productIds?: number[];
    categoryIds?: number[];
  }
): Promise<BogoCampaign> {
  return postData<BogoCampaign>("bogo-campaigns", payload).then(
    (response) => response.data as BogoCampaign
  );
}

export function updateBogoCampaign(
  id: string | number,
  payload: Partial<BogoCampaign> & {
    validFrom?: string;
    validUntil?: string;
    productIds?: number[];
    categoryIds?: number[];
  }
): Promise<BogoCampaign> {
  return patchData<BogoCampaign>(`bogo-campaigns/${id}`, payload).then(
    (response) => response.data as BogoCampaign
  );
}

export function deleteBogoCampaign(id: string | number): Promise<unknown> {
  return deleteData("bogo-campaigns", id);
}

/** Paginated BOGO usage logs for the admin page. */
export function getAllBogoUsageLogs(
  page: number,
  limit: number
): Promise<{
  data: BogoUsageLog[];
  total: number;
  totalPages: number;
}> {
  return fetchDataPagination(
    `bogo-usage-logs?page=${page}&limit=${limit}`
  );
}

/** Public cart preview — estimate the BOGO discount (display-only). */
export function previewBogo(
  items: { productId: number; quantity: number }[]
): Promise<BogoPreviewResult> {
  return postData<BogoPreviewResult>("bogo-campaigns/preview", {
    items,
  }).then((response) => response.data as BogoPreviewResult);
}
