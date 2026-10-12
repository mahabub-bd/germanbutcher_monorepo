
export function pdfImageUrl(url?: string | null): string {
  if (!url) return "/images/logo3.png";
  return `/api/pdf-image?url=${encodeURIComponent(url)}`;
}
