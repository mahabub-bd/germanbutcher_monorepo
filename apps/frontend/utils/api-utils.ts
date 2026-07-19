import { deleteCookie, getToken } from "@/actions/auth";

export type ApiResponse<T = any> = {
  id: any;
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
  statusCode?: number;
  otpExpiresAt?: any;
};

export const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;

// Simple in-memory cache for product endpoints
const productCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache

export async function fetchData<T>(endpoint: string): Promise<T> {
  // Check cache for product endpoints (both slug and id based)
  if (endpoint.startsWith('products/slug/') || endpoint.match(/products\/\d+$/)) {
    const cached = productCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const url = `${apiUrl}/${endpoint}`;

  try {
    const response = await fetch(url);

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

    // Cache product slug endpoints for 5 seconds
    if (endpoint.startsWith('products/slug/')) {
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

export async function fetchProtectedData<T>(endpoint: string): Promise<T> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await getToken();

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      next: { tags: ["dashboard"] },
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

      if (response.status === 401) {
        console.error("Unauthorized access - possibly expired token");
        await deleteCookie(["auth_token", "user"]);
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

export async function fetchDataPagination<T>(endpoint: string): Promise<T> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await getToken();
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      next: { tags: ["dashboard"] },
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

// Public fetch function for non-authenticated endpoints (supports ISR)
export async function fetchPublicData<T>(endpoint: string): Promise<T> {
  const url = `${apiUrl}/${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Enable ISR with 60s revalidation
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
export async function postData<T = any>(
  endpoint: string,
  values?: any
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await getToken(); // Get the token just like in fetchProtectedData

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

export async function logoutPost(endpoint: string, token: any): Promise<void> {
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
export async function formPostData<T = any>(
  endpoint: string,
  formData?: FormData | Record<string, any>
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await getToken();
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

export async function patchData<T = any>(
  endpoint: string,
  values?: any,
  options?: {
    isMultipart?: boolean;
    headers?: Record<string, string>;
    noAuth?: boolean;
  }
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}/${endpoint}`;
  const token = await getToken();

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
      body: options?.isMultipart ? values : JSON.stringify(values),
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

export async function deleteData(
  endpoint: string,
  id?: string | number
): Promise<void> {
  const url = `${apiUrl}/${endpoint}/${id}`;
  const token = await getToken();
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
): Promise<ApiResponse> {
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
