/**
 * Resolve the logo URL used inside @react-pdf documents.
 * Remote S3 logos are routed through our own /api/pdf-image proxy because
 * the bucket sends no CORS headers and react-pdf fetches images from the
 * browser (which would be blocked). Falls back to the bundled static logo.
 */
export function pdfImageUrl(url?: string | null): string {
  if (!url) return "/images/logo3.png";
  return `/api/pdf-image?url=${encodeURIComponent(url)}`;
}
