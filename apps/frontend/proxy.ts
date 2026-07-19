// middleware.js
import { NextResponse } from "next/server";
import { getUser } from "./actions/auth";

export async function proxy(req: any) {
  const { pathname } = req.nextUrl;

  const userProtectedRoutes = ["/user", "/order-confirmation"];
  const adminProtectedRoutes = ["/admin"];

  const isUserProtected = userProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminProtected = adminProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isUserProtected && !isAdminProtected) {
    return NextResponse.next();
  }

  try {
    const user = await getUser();

    // If not logged in → redirect to login
    if (!user) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    // Check admin / moderator access
    const userRole =
      typeof user.roles === "string"
        ? user.roles.toLowerCase()
        : user.roles?.rolename?.toLowerCase();

    const isAdminOrModerator =
      user.isAdmin || ["admin", "superadmin", "moderator"].includes(userRole);

    if (isAdminProtected && !isAdminOrModerator) {
      return NextResponse.redirect(new URL("/user", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*"],
};
