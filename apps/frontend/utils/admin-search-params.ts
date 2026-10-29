export type ResolvedSearchParams = {
  [key: string]: string | string[] | undefined;
};

export interface ListPageProps {
  searchParams: Promise<ResolvedSearchParams>;
}

export interface ListSearchParams {
  page: number;
  limit: number;
  searchParams: ResolvedSearchParams;
}

/**
 * Awaits a page's `searchParams` and parses the standard `page`/`limit`
 * params. Use with `AdminPageContainer` to compose a list page:
 *
 *   export default async function RecipesPage({ searchParams }: ListPageProps) {
 *     const { page, limit, searchParams: params } = await parseListSearchParams(searchParams);
 *     ...
 *   }
 */
export async function parseListSearchParams(
  searchParams: ListPageProps["searchParams"],
  defaultLimit = 10,
): Promise<ListSearchParams> {
  const resolved = await searchParams;
  return {
    page: parseIntParam(resolved.page, 1),
    limit: parseIntParam(resolved.limit, defaultLimit),
    searchParams: resolved,
  };
}

/**
 * Parses a numeric search param, falling back when missing or non-numeric.
 */
export function parseIntParam(
  value: string | string[] | undefined,
  fallback: number,
): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Parses a string search param, falling back when missing or multi-valued.
 */
export function parseStringParam(
  value: string | string[] | undefined,
  fallback?: string,
): string | undefined {
  return typeof value === "string" ? value : fallback;
}
