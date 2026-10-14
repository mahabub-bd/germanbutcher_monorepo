"use server";

import { logoutPost, postData } from "@/utils/api-utils";

import { loginSchema, registerSchema } from "@/utils/form-validation";
import type { OtpVerificationResponse } from "@/components/auth/otp-verification-modal";
import { authResponse, UserTypes } from "@/utils/types";
import { cookies } from "next/headers";
import { z } from "zod";
import { getUserFromToken } from "./jwt-utils";

export type RegisterFormData = z.infer<typeof registerSchema>;

export type LoginFormData = z.infer<typeof loginSchema>;

/** roles may arrive as a plain string or the full Role object — normalize to rolename */
function roleNameOf(roles: unknown): string {
  if (typeof roles === "string") return roles;
  return (roles as { rolename?: string } | null)?.rolename ?? "";
}

const ADMIN_ROLE_NAMES = ["admin", "superadmin", "modaretor"];

function isAdminRole(roles: unknown): boolean {
  return ADMIN_ROLE_NAMES.includes(roleNameOf(roles));
}

/** Shape accepted by setUserCookies: an auth API response with the access
 * token at `data.accessToken` (login / verify-otp) or `token`, plus user
 * info either at `data.user` or spread at the top level. */
type AuthCookieUserData = {
  data?: {
    accessToken?: string | null;
    user?: {
      id?: number | null;
      name?: string | null;
      email?: string | null;
      mobileNumber?: string | null;
      roles?: unknown;
      profilePhoto?: UserTypes["profilePhoto"];
      createdAt?: string | null;
    } | null;
  } | null;
  token?: string | null;
  id?: number;
  name?: string;
  email?: string;
  mobileNumber?: string;
  mobileNo?: string;
  roles?: unknown;
  profilePhoto?: UserTypes["profilePhoto"];
  createdAt?: string;
};

export async function setUserCookies(userData: AuthCookieUserData) {
  const cookieStore = await cookies();

  const authToken = userData?.data?.accessToken || userData?.token;
  if (!authToken) {
    console.error("No auth token provided");
    return false;
  }

  cookieStore.set({
    name: "auth_token",
    value: authToken,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400,
    sameSite: "lax",
  });

  let userInfo: {
    id: number;
    name: string;
    email: string;
    mobileNumber: string;
    roles: unknown;
    isAdmin: boolean;
    profilePhoto: UserTypes["profilePhoto"];
    createdAt: string | undefined;
  } = {
    id: 0,
    name: "Customer",
    email: "",
    mobileNumber: "",
    roles: "",
    isAdmin: false,
    profilePhoto: undefined as UserTypes["profilePhoto"],
    createdAt: "",
  };

  try {
    // Extract user info from response.data.user (from verifyOtp response)
    if (userData?.data?.user) {
      const user = userData.data.user;
      userInfo = {
        id: user.id || 0,
        name: user.name || "Customer",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        roles: user.roles || "",
        isAdmin: isAdminRole(user.roles),
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt || "",
      };
    }
    // Fallback: check if user data is at top level of response (from token data)
    else if (userData?.name || userData?.email) {
      userInfo = {
        id: userData.id || 0,
        name: userData.name || "Customer",
        email: userData.email || "",
        mobileNumber: userData.mobileNumber || "",
        roles: userData.roles || "",
        isAdmin: isAdminRole(userData.roles),
        profilePhoto: userData.profilePhoto,
        createdAt: userData.createdAt || "",
      };
    }
    // Legacy fallback for mobileNo format
    else if (userData?.mobileNo) {
      userInfo = {
        id: 0,
        name: userData.name || "Customer",
        email: userData.email || `${userData.mobileNo}@example.com`,
        mobileNumber: userData.mobileNo,
        roles: roleNameOf(userData.roles),
        isAdmin: isAdminRole(userData.roles),
        profilePhoto: userData.profilePhoto,
        createdAt: userData?.createdAt,
      };
    }

    const userJson = JSON.stringify(userInfo);
    if (!userJson) throw new Error("Failed to stringify user info");

    cookieStore.set({
      name: "user",
      value: userJson,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
      sameSite: "lax",
    });

    return true;
  } catch (error) {
    console.error("Error setting user cookies:", error);

    cookieStore.delete("auth_token");
    cookieStore.delete("user");
    return false;
  }
}
export async function login(formData: LoginFormData) {
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await postData<{ accessToken: string; user: UserTypes }>(
      "auth/login",
      validatedFields.data
    );

    if (response?.data?.accessToken) {
      const tokenData = getUserFromToken(response.data.accessToken);
      const userData = {
        ...response,
        ...tokenData,
      };

      await setUserCookies(userData);

      const redirectPath = "/";

      return {
        success: true,
        message: response?.message,
        redirect: redirectPath,
      };
    }

    return {
      success: false,
      message: response?.message,
    };
  } catch {
    return {
      success: false,
      message: "Invalid credentials",
    };
  }
}

export async function register(formData: RegisterFormData) {
  const validatedFields = registerSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await postData("auth/register", validatedFields.data);

    return {
      success: true,
      message: response?.message || "Registration successful. Please login.",
      redirect: "/auth/sign-in",
    };
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    } else {
      return {
        success: false,
        message: "Registration failed",
      };
    }
  }
}
export async function logout(): Promise<authResponse> {
  const cookieStore = await cookies();

  try {
    const token = cookieStore.get("auth_token");
    if (token?.value) {
      await logoutPost("auth/logout", token.value);
      return {
        statusCode: 200,
        message: "Logout successful",
      };
    }
  } catch (error) {
    console.error("Logout API error:", error);
    return {
      statusCode: 500,
      message: "Logout failed due to an error",
    };
  } finally {
    await deleteCookie(["auth_token", "user"]);
  }

  return {
    statusCode: 400,
    message: "No token found for logout",
  };
}
export async function getUser() {
  const cookieStore = await cookies();
  const userCookie = cookieStore?.get("user");

  if (!userCookie?.value) return null;

  try {
    const parsedValue = JSON.parse(userCookie.value);

    if (typeof parsedValue !== "object" || parsedValue === null) {
      console.error("Invalid user data format");
      return null;
    }

    // Sessions created before profilePhoto was stored in the cookie lack the
    // key entirely — backfill it from the API so the navbar can show the
    // photo without forcing a re-login.
    if (parsedValue.id && parsedValue.profilePhoto === undefined) {
      try {
        const token = cookieStore.get("auth_token")?.value;
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1";
        const res = await fetch(`${apiUrl}/users/${parsedValue.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          parsedValue.profilePhoto = json?.data?.profilePhoto;
        }
      } catch {
        // Best effort only — fall back to the initials avatar
      }
    }

    return parsedValue;
  } catch (error) {
    console.error("Error parsing user data:", error);

    cookieStore.delete("user");
    return null;
  }
}

export async function getToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token?.value) return null;

  try {
    return token.value;
  } catch (error) {
    console.error("Error parsing token data:", error);

    cookieStore.delete("auth_token");
    return null;
  }
}
export async function mobileLogin(mobileNumber: string) {
  try {
    const response = await postData<
      NonNullable<OtpVerificationResponse["data"]>
    >("auth/mobile-login", { mobileNumber });

    return response;
  } catch (error) {
    console.error("Mobile login error:", error);
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
}

export async function verifyOtp(data: {
  mobileNumber: string;
  otp: string;
  otpExpiresAt?: string;
  name?: string;
}) {
  try {
    // Don't send auth token for OTP verification (it's a public endpoint)
    const response = await postData<{ accessToken: string; user: UserTypes }>(
      "auth/verify-otp",
      data
    );

    if (response?.data?.accessToken) {
      const tokenData = getUserFromToken(response.data.accessToken);
      const userData = {
        ...response,
        ...tokenData,
      };

      await setUserCookies(userData);

      const redirectPath = "/";

      return {
        success: true,
        message: response?.message,
        redirect: redirectPath,
        data: {
          userId: response.data.user?.id,
          user: response.data.user,
        },
      };
    }

    return {
      success: false,
      message: response?.message || "OTP verification failed",
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
}

export async function deleteCookie(
  cookieNames: string | string[]
): Promise<boolean> {
  const cookieStore = await cookies();
  const namesToDelete = Array.isArray(cookieNames)
    ? cookieNames
    : [cookieNames];

  try {
    namesToDelete.forEach((name) => {
      cookieStore.delete(name);
    });
    return true;
  } catch (error) {
    console.error("Error deleting cookies:", error);
    return false;
  }
}
