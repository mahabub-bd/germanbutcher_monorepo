import { fetchProtectedData } from "./api-utils";
import type {
  AnalyticsOverview,
  AnalyticsPeriod,
  AnalyticsRequests,
  ConversionData,
  DeviceBreakdownData,
  OnlineUsers,
  PeakTraffic,
  ResponseTimes,
  TopEndpoint,
  TopProductPage,
  TrafficSource,
  VisitorsData,
} from "./types";

const ANALYTICS_BASE = "analytics";

export async function fetchAnalyticsOverview(
  period: AnalyticsPeriod = "24h",
  options?: { revalidate?: number }
): Promise<AnalyticsOverview> {
  const result = await fetchProtectedData<AnalyticsOverview>(
    `analytics/overview?period=${period}`,
    options
  );
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
  limit: number = 10,
  period: AnalyticsPeriod = "7d"
): Promise<TopEndpoint[]> {
  const result = await fetchProtectedData<TopEndpoint[] | { data: TopEndpoint[] }>(`${ANALYTICS_BASE}/top-endpoints?limit=${limit}&period=${period}`);
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

export async function fetchOnlineUsers(): Promise<OnlineUsers> {
  const result = await fetchProtectedData<OnlineUsers | { data: OnlineUsers }>(
    `online-users?window=5`
  );
  if (result && typeof result === "object" && "data" in result && typeof result.data === "object") {
    return result.data;
  }
  return result as OnlineUsers;
}

export async function fetchAllAnalyticsData(period: AnalyticsPeriod = "24h") {
  const [
    overview,
    requests,
    peakTraffic,
    visitors,
    topEndpoints,
    responseTimes,
    devices,
    topPages,
    trafficSources,
    conversion,
  ] = await Promise.all([
    fetchAnalyticsOverview(period),
    fetchAnalyticsRequests(period),
    fetchPeakTraffic("7d"),
    fetchVisitors("30d"),
    fetchTopEndpoints(10, period),
    fetchResponseTimes(period),
    fetchDeviceBreakdown(period),
    fetchTopProductPages("7d"),
    fetchTrafficSources("30d"),
    fetchConversion("30d"),
  ]);

  return {
    overview,
    requests,
    peakTraffic,
    visitors,
    topEndpoints,
    responseTimes,
    devices,
    topPages,
    trafficSources,
    conversion,
  };
}

export async function fetchDeviceBreakdown(
  period: AnalyticsPeriod = "7d"
): Promise<DeviceBreakdownData> {
  const result = await fetchProtectedData<
    DeviceBreakdownData | { data: DeviceBreakdownData }
  >(`${ANALYTICS_BASE}/devices?period=${period}`);
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    typeof result.data === "object"
  ) {
    return result.data;
  }
  return result as DeviceBreakdownData;
}

export async function fetchTopProductPages(
  period: AnalyticsPeriod = "7d",
  limit = 8
): Promise<TopProductPage[]> {
  const result = await fetchProtectedData<
    TopProductPage[] | { data: TopProductPage[] }
  >(`${ANALYTICS_BASE}/top-pages?period=${period}&limit=${limit}`);
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    Array.isArray(result.data)
  ) {
    return result.data;
  }
  return result as TopProductPage[];
}

export async function fetchTrafficSources(
  period: AnalyticsPeriod = "30d"
): Promise<TrafficSource[]> {
  const result = await fetchProtectedData<
    TrafficSource[] | { data: TrafficSource[] }
  >(`${ANALYTICS_BASE}/traffic-sources?period=${period}`);
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    Array.isArray(result.data)
  ) {
    return result.data;
  }
  return result as TrafficSource[];
}

export async function fetchConversion(
  period: AnalyticsPeriod = "30d"
): Promise<ConversionData> {
  const result = await fetchProtectedData<
    ConversionData | { data: ConversionData }
  >(`${ANALYTICS_BASE}/conversion?period=${period}`);
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    typeof result.data === "object"
  ) {
    return result.data;
  }
  return result as ConversionData;
}
