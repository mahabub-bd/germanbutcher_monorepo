import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Stable endpoint for reading/clearing the httpOnly auth cookies from the
 * client. Unlike Server Actions, the URL does not change between deployments,
 * so tabs opened before a redeploy keep working instead of failing with
 * "Failed to find Server Action".
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? null;

  return NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("user");

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
