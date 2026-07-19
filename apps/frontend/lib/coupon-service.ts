import { ApiResponse, postData } from "@/utils/api-utils";

export type ValidateCouponResponse = {
  message: string;
  statusCode: number;
  data: null;
};

export interface ValidateCouponForCartResponse {
  valid: boolean;
  message: string;
  excludedProducts?: string[];
  excludedProductIds?: number[];
}

export interface ExcludedProduct {
  id: number;
  name: string;
}

export interface ApplyCouponResponse {
  message: string;
  statusCode: number;
  discountedAmount: number;
  discountValue: number;
  couponId: number;
  eligibleAmount: number;
  excludedProducts?: ExcludedProduct[];
}

export interface CartItemForCoupon {
  productId: number;
  price: number;
}

export async function validateCoupon(
  code: string
): Promise<ApiResponse<ValidateCouponResponse>> {
  try {
    const response = await postData<ValidateCouponResponse>(
      `coupons/validate?code=${encodeURIComponent(code)}`
    );
    return response;
  } catch (error) {
    console.error("Error validating coupon:", error);
    throw error;
  }
}

export async function validateCouponForCart(
  code: string,
  productIds: number[]
): Promise<ApiResponse<ValidateCouponForCartResponse>> {
  try {
    const productIdsParam = productIds.join(",");
    const response = await postData<ValidateCouponForCartResponse>(
      `coupons/validate-cart?code=${encodeURIComponent(code)}&productIds=${productIdsParam}`
    );
    return response;
  } catch (error) {
    console.error("Error validating coupon for cart:", error);
    throw error;
  }
}

export async function applyCoupon(
  code: string,
  cartItems: CartItemForCoupon[]
): Promise<ApiResponse<ApplyCouponResponse>> {
  try {
    const response = await postData<ApplyCouponResponse>("coupons/apply", {
      code,
      cartItems,
    });
    return response;
  } catch (error) {
    console.error("Error applying coupon:", error);
    throw error;
  }
}
