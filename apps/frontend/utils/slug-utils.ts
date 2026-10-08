/**
 * Slug suggestion helper for the product form. Mirrors the backend's
 * `generateSlug()` (transliteration `slugify`) closely enough for a live
 * suggestion without adding a dependency.
 */
const GERMAN_MAP: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  Ä: "ae",
  Ö: "oe",
  Ü: "ue",
  ß: "ss",
};

export function slugifyName(name: string): string {
  return name
    .split("")
    .map((char) => GERMAN_MAP[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (U+0300-U+036F)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
