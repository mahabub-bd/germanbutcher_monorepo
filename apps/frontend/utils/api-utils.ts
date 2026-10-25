export type ApiResponse<T = unknown> = {
  id: string | number;
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
  statusCode?: number;
  otpExpiresAt?: string;
};

export const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;


let cachedAuthToken: string | null = null;
let tokenFetch: Promise<string | null> | null = null;

export function resetAuthTokenCache(): void {
  cachedAuthToken = null;
}


export async function resolveAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    const { getToken } = await import("@/actions/auth");
    return getToken();
  }

  if (cachedAuthToken) return cachedAuthToken;

  if (!tokenFetch) {
    tokenFetch = (async () => {
      try {
        const response = await fetch("/api/auth/token", { cache: "no-store" });
        if (!response.ok) return null;
        const json = await response.json();
        cachedAuthToken = json?.token ?? null;
        return cachedAuthToken;
      } catch {
        return null;
      } finally {
        tokenFetch = null;
      }
    })();
  }
  return tokenFetch;
}


export async function clearAuthCookies(): Promise<void> {
  cachedAuthToken = null;

  if (typeof window === "undefined") {
    const { deleteCookie } = await import("@/actions/auth");
    await deleteCookie(["auth_token", "user"]);
    return;
  }

  try {
    await fetch("/api/auth/token", { method: "DELETE", cache: "no-store" });
  } catch {
    // Best-effort cleanup; the caller still handles the failed request
  }
}


const productCache = new Map<string, { data: unknown; timestamp: number }>();
const PRODUCT_CACHE_TTL = 5000; // 5 seconds cache

const isClient = () => typeof window !== "undefined";

export async function fetchData<T>(endpoint: string): Promise<T> {
  // Check cache for product endpoints (both slug and id based)
  if (
    isClient() &&
    (endpoint.startsWith("products/slug/") ||
      endpoint.match(/products\/\d+$/))
  ) {
    const cached = productCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < PRODUCT_CACHE_TTL) {
      return cached.data as T;
    }
  }

  const url = `${apiUrl}/${endpoint}`;

  try {

    const isProductData = endpoint.startsWith("products");
    // Product detail pages must never enter the Next.js Data Cache:
    // with revalidate, a failed revalidation (e.g. product deactivated and
    // the backend now 404s) serves the stale cached page indefinitely.
    // no-store keeps deactivations effective immediately; the client-side
    // 5s cache and the backend's query cache absorb the load.
    const isProductDetail =
      endpoint.startsWith("products/slug/") ||
      Boolean(endpoint.match(/products\/\d+$/));
    const response = await fetch(
      url,
      isProductDetail
        ? { cache: "no-store" }
        : {
            next: {
              revalidate: isProductData ? 300 : 60,
              tags: isProductData ? ["products"] : [],
            },
          },
    );

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const data = result.data;


    if (isClient() && endpoint.startsWith('products/slug/')) {
      productCache.set(endpoint, {
        data,
        timestamp: Date.now(),
      });
    }

    return data;
  } catch (error: unknown) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
}

export async function fetchProtectedData<T>(
  endpoint: string,
  options?: { revalidate?: number }
): Promise<T> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await resolveAuthToken();

  const init: RequestInit & { next?: Record<string, unknown> } = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (options?.revalidate) {
    init.next = { revalidate: options.revalidate, tags: ["dashboard"] };
  } else {
    init.cache = "no-store";
  }

  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }

      if (response.status === 401) {
        console.error("Unauthorized access - possibly expired token");
        await clearAuthCookies();
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error: unknown) {
    console.error(`Error fetching protected data from ${endpoint}:`, error);
    throw error;
  }
}

export async function fetchDataPagination<T>(
  endpoint: string,
  options?: { revalidate?: number }
): Promise<T> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await resolveAuthToken();
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      ...(options?.revalidate
        ? { next: { revalidate: options.revalidate, tags: ["dashboard"] } }
        : { cache: "no-store" }),
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error: unknown) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
}


export async function fetchPublicData<T>(endpoint: string): Promise<T> {
  const url = `${apiUrl}/${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60, tags: ["public"] }, // ISR with 60s fallback
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const data = result.data; // Extract data property like fetchData does

    return data;
  } catch (error: unknown) {
    console.error(`Error fetching public data from ${endpoint}:`, error);
    throw error;
  }
}
export async function postData<T = unknown>(
  endpoint: string,
  values?: unknown
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await resolveAuthToken(); // Get the token just like in fetchProtectedData

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Add the Authorization header
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }

      if (response.status === 401) {
        console.error("Unauthorized access - possibly expired token");
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Error posting data:", error);
    throw error;
  }
}

export async function logoutPost(
  endpoint: string,
  token: string
): Promise<void> {
  const url = `${apiUrl}/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message || `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Logout failed:", error);
    throw error;
  }
}
export async function formPostData<T = unknown>(
  endpoint: string,
  formData?: FormData | Record<string, unknown>
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await resolveAuthToken();
  const headers: HeadersInit = {};

  let body: BodyInit;
  if (formData instanceof FormData) {
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(formData || {});
  }

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Error posting data:", error);
    throw error;
  }
}

export async function patchData<T = unknown>(
  endpoint: string,
  values?: unknown,
  options?: {
    isMultipart?: boolean;
    headers?: Record<string, string>;
    noAuth?: boolean;
  }
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await resolveAuthToken();

  try {
    const headers: HeadersInit = {
      ...(options?.headers || {}),
    };

    if (!options?.isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: options?.isMultipart ? (values as BodyInit) : JSON.stringify(values),
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Error patching data:", error);
    throw error;
  }
}

export async function putData<T = unknown>(
  endpoint: string,
  values?: unknown,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await resolveAuthToken();

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Error putting data:", error);
    throw error;
  }
}

export async function deleteData(
  endpoint: string,
  id?: string | number
): Promise<void> {
  const url = `${apiUrl}/${endpoint}/${id}`;
  const token = await resolveAuthToken();
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP error! Status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting data:", error);
    throw error;
  }
}

export function buildQueryString(
  params: Record<string, string | string[] | undefined>
): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.set(key, value);
      }
    }
  });

  return queryParams.toString();
}

export async function fetchOrderById(id: string) {
  return fetchProtectedData(`orders/${id}`);
}

export async function cancelOrder(
  orderId: number,
  reason: string,
  notes?: string
): Promise<ApiResponse<{ orderNo: string }>> {
  return patchData(`orders/${orderId}/cancel`, { reason, notes });
}

export interface RefundRequest {
  paymentId: number;
  refund_amount: number;
  refund_remarks?: string;
  bank_tran_id: string;
  tran_id: string;
  refe_id: string;
}

export async function initiateRefund(refundData: RefundRequest): Promise<ApiResponse> {
  return postData("payment/refund", refundData);
}

export async function fetchProductBySlug(slug: string) {
  return fetchData(`products/${slug}`);
}
