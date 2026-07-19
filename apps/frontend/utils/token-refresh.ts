"use server";

import { setUserCookies } from "@/actions/auth";
import { apiUrl } from "@/utils/api-utils";
import { cookies } from "next/headers";

export async function refreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get("auth_token")?.value;

  if (!currentToken) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ token: currentToken }),
    });

    if (!response.ok) {
      cookieStore.delete("auth_token");
      cookieStore.delete("user");
      return null;
    }

    const data = await response.json();

    if (data?.data?.accessToken) {
      await setUserCookies(data);
      return data.data.accessToken;
    }

    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);

    cookieStore.delete("auth_token");
    cookieStore.delete("user");
    return null;
  }
}
