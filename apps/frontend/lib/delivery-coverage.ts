import { DIVISION_DISTRICTS, DISTRICT_AREAS } from "@/data/districts-areas";
import type { BusinessSettings } from "@/utils/types";

/** Delivery coverage stored in Business Settings — plain lists, seeded once
 *  from the bundled Bangladesh dataset and then fully editable in the DB
 *  (add / rename / delete / enable / disable any entry). */
export interface CoverageDivision {
  name: string;
  enabled: boolean;
}

export interface CoverageCity {
  division: string;
  name: string;
  enabled: boolean;
}

export interface CoverageArea {
  city: string;
  name: string;
  enabled: boolean;
}

export interface DeliveryCoverage {
  divisions: CoverageDivision[];
  cities: CoverageCity[];
  areas: CoverageArea[];
}

type Coverage = BusinessSettings["deliveryCoverage"];

/** Convert whatever is stored (nothing yet, the old on/off-map format, or
 *  the current list format) into the current list format — seeding the
 *  bundled dataset on first use and preserving previous on/off states. */
export function normalizeCoverage(raw: unknown): DeliveryCoverage {
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as DeliveryCoverage).divisions)
  ) {
    const coverage = raw as DeliveryCoverage;
    return {
      divisions: coverage.divisions ?? [],
      cities: coverage.cities ?? [],
      areas: coverage.areas ?? [],
    };
  }

  // Old format: { divisions: {Name:boolean}, cities: {...}, areas: {...},
  // customAreas?: {city: string[]} } — or null/undefined (first use).
  const old = (raw ?? {}) as {
    divisions?: Record<string, boolean>;
    cities?: Record<string, boolean>;
    areas?: Record<string, boolean>;
    customAreas?: Record<string, string[]>;
  };

  const divisions = Object.keys(DIVISION_DISTRICTS).map((name) => ({
    name,
    enabled: old.divisions?.[name] !== false,
  }));

  const cities = Object.entries(DIVISION_DISTRICTS).flatMap(
    ([division, list]) =>
      list.map((name) => ({
        division,
        name,
        enabled: old.cities?.[name] !== false,
      }))
  );

  const areas = DISTRICT_AREAS.flatMap(({ district, areas: list }) => [
    ...list,
    ...(old.customAreas?.[district] ?? []),
  ]).map((name) => ({
    name,
    // The old format keyed areas by name only — keep its state if present.
    enabled: old.areas?.[name] !== false,
    city: "",
  }));

  // Attach each area to its city via the dataset lookup (names repeat
  // across districts, so re-derive instead of using the flat map above).
  const withCity = DISTRICT_AREAS.flatMap(({ district, areas: list }) =>
    [...list, ...(old.customAreas?.[district] ?? [])].map((name) => ({
      city: district,
      name,
      enabled: old.areas?.[name] !== false,
    }))
  );
  void areas;

  return { divisions, cities, areas: withCity };
}

/** Divisions the business delivers to, sorted. Null coverage (never
 *  configured) falls back to the full bundled dataset. */
export function getEnabledDivisions(coverage: Coverage): string[] {
  const source = coverage
    ? coverage.divisions.filter((d) => d.enabled).map((d) => d.name)
    : Object.keys(DIVISION_DISTRICTS);
  return [...new Set(source)].sort((a, b) => a.localeCompare(b));
}

/** Cities (districts) of a division that are enabled. */
export function getEnabledCities(
  coverage: Coverage,
  division: string | null | undefined
): string[] {
  const source = coverage
    ? coverage.cities
        .filter((c) => c.enabled && (!division || c.division === division))
        .map((c) => c.name)
    : division
      ? (DIVISION_DISTRICTS[division] ?? [])
      : Object.values(DIVISION_DISTRICTS).flat();
  return [...new Set(source)].sort((a, b) => a.localeCompare(b));
}

/** Areas of a city that are enabled. */
export function getEnabledAreas(
  coverage: Coverage,
  city: string | null | undefined
): string[] {
  const source = coverage
    ? coverage.areas
        .filter((a) => a.enabled && (!city || a.city === city))
        .map((a) => a.name)
    : city
      ? (DISTRICT_AREAS.find((d) => d.district === city)?.areas ?? [])
      : DISTRICT_AREAS.flatMap((d) => d.areas);
  return [...new Set(source)].sort((a, b) => a.localeCompare(b));
}
