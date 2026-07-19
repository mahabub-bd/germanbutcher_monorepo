import { fetchProtectedData } from "./api-utils";
import type {
  AnalyticsOverview,
  AnalyticsPeriod,
  AnalyticsRequests,
  PeakTraffic,
  ResponseTimes,
  TopEndpoint,
  VisitorsData,
} from "./types";

const ANALYTICS_BASE = "analytics";

export async function fetchAnalyticsOverview(
  period: AnalyticsPeriod = "24h"
): Promise<AnalyticsOverview> {
  const result = await fetchProtectedData<AnalyticsOverview>(`analytics/overview?period=${period}`);
  // Ensure we're returning the actual data, not a wrapped response
  if (result && typeof result === "object" && "data" in result && typeof result.data === "object") {
    return result.data as AnalyticsOverview;
  }
  return result;
}

export async function fetchAnalyticsRequests(
  period: AnalyticsPeriod = "24h"
): Promise<AnalyticsRequests[]> {
  const result = await fetchProtectedData<AnalyticsRequests[] | { data: AnalyticsRequests[] }>(`${ANALYTICS_BASE}/requests?period=${period}`);
  // Unwrap the response if it's wrapped in a data property
  if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
    return result.data;
  }
  return result as AnalyticsRequests[];
}

export async function fetchPeakTraffic(
  period: AnalyticsPeriod = "7d"
): Promise<PeakTraffic[]> {
  const result = await fetchProtectedData<PeakTraffic[] | { data: PeakTraffic[] }>(`${ANALYTICS_BASE}/peak-traffic?period=${period}`);
  // Unwrap the response if it's wrapped in a data property
  if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
    return result.data;
  }
  return result as PeakTraffic[];
}

export async function fetchVisitors(
  period: AnalyticsPeriod = "7d"
): Promise<VisitorsData[]> {
  const result = await fetchProtectedData<VisitorsData[] | { data: VisitorsData[] }>(`${ANALYTICS_BASE}/visitors?period=${period}`);
  // Unwrap the response if it's wrapped in a data property
  if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
    return result.data;
  }
  return result as VisitorsData[];
}

export async function fetchTopEndpoints(
  limit: number = 10
): Promise<TopEndpoint[]> {
  const result = await fetchProtectedData<TopEndpoint[] | { data: TopEndpoint[] }>(`${ANALYTICS_BASE}/top-endpoints?limit=${limit}`);
  // Unwrap the response if it's wrapped in a data property
  if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
    return result.data;
  }
  return result as TopEndpoint[];
}

export async function fetchResponseTimes(
  period: AnalyticsPeriod = "24h"
): Promise<ResponseTimes> {
  const result = await fetchProtectedData<ResponseTimes | { data: ResponseTimes }>(`${ANALYTICS_BASE}/response-times?period=${period}`);
  // Unwrap the response if it's wrapped in a data property
  if (result && typeof result === "object" && "data" in result && typeof result.data === "object") {
    return result.data as ResponseTimes;
  }
  return result as ResponseTimes;
}

export async function fetchAllAnalyticsData(period: AnalyticsPeriod = "24h") {
  const [overview, requests, peakTraffic, visitors, topEndpoints, responseTimes] =
    await Promise.all([
      fetchAnalyticsOverview(period),
      fetchAnalyticsRequests(period),
      fetchPeakTraffic("7d"),
      fetchVisitors("7d"),
      fetchTopEndpoints(10),
      fetchResponseTimes(period),
    ]);

  return {
    overview,
    requests,
    peakTraffic,
    visitors,
    topEndpoints,
    responseTimes,
  };
}
