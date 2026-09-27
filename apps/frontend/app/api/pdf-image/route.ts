import { NextRequest, NextResponse } from "next/server";

// Only attachments from our own bucket may be proxied (prevents SSRF abuse).
const ALLOWED_HOST = "germanbutcher.s3.ap-southeast-1.amazonaws.com";

/**
 * Streams an S3 attachment through this origin so @react-pdf/renderer can
 * fetch it without CORS restrictions (the bucket sends no CORS headers,
 * which makes browser-side PDF image loading fail).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  if (parsed.protocol !== "https:" || parsed.host !== ALLOWED_HOST) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Failed to fetch image", { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/octet-stream",
        "Content-Length": upstream.headers.get("content-length") || "",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
