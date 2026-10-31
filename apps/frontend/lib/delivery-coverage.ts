import { DIVISION_DISTRICTS, DISTRICT_AREAS } from "@/data/districts-areas";
import type { BusinessSettings } from "@/utils/types";

/** Delivery coverage stored in Business Settings — plain lists, seeded once
 *  from the bundled Bangladesh dataset and then fully editable in the DB
 *  (add / rename / delete / enable / disable any entry). */
export interface CoverageDivision {
  name: string;
  enabled: boolean;
  /** Division-wide delivery time (e.g. "48-72 hours") inherited by its
   *  cities and areas; null = show the shipping method's own time. */
  deliveryTime?: string | null;
}

export interface CoverageCity {
  division: string;
  name: string;
  enabled: boolean;
  /** City-wide delivery charge (৳) inherited by its areas; null = shipping method cost. */
  deliveryCharge?: number | null;
  /** City-wide minimum order amount (৳) inherited by its areas; null = no minimum. */
  minOrderAmount?: number | null;
  /** City-wide delivery time (e.g. "24-48 hours") inherited by its areas;
   *  null = show the shipping method's own delivery time. */
  deliveryTime?: string | null;
}

export interface CoverageArea {
  city: string;
  name: string;
  enabled: boolean;
  /** Area-specific delivery charge (৳); null/undefined = use the shipping method's cost. */
  deliveryCharge?: number | null;
  /** Minimum order subtotal (৳) for this area; null/undefined = no area minimum. */
  minOrderAmount?: number | null;
  /** Area-specific delivery time (e.g. "Within 24 hours"); null/undefined =
   *  inherit the city's delivery time, or the shipping method's when the
   *  city has none. */
  deliveryTime?: string | null;
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

export interface AreaPricing {
  /** Area-specific delivery charge; null = no override (use shipping method). */
  deliveryCharge: number | null;
  /** Minimum order subtotal required for the area; null = no minimum. */
  minOrderAmount: number | null;
  /** Area/city delivery time (e.g. "24-48 hours"); null = none configured. */
  deliveryTime: string | null;
}

/** Legacy/alternate spellings that appear in saved addresses (free text) —
 *  mapped to the canonical dataset names used by coverage. Mirrors
 *  backend/scripts/backfill-divisions.js. */
const LOCATION_NAME_ALIASES: Record<string, string> = {
  barishal: "barisal",
};

/** Case/spacing-insensitive name key so saved addresses like "BARISHAL" or
 *  "barisal " still match the coverage entry "Barisal". */
export const normalizeLocationName = (value: string): string => {
  const trimmed = value.trim().toLowerCase().replace(/\s+/g, " ");
  return LOCATION_NAME_ALIASES[trimmed] ?? trimmed;
};

/**
 * Whether a shipping method is offered at a city/area. Methods with no
 * serviceAreas config are available everywhere. mode "include": a match on
 * either list allows the method; mode "exclude": a match disables it
 * (available everywhere else). Applies to ALL methods including store pickup.
 */
export const isShippingMethodAvailable = (
  method: {
    serviceAreas?: {
      mode?: "include" | "exclude";
      cities: string[];
      areas: string[];
    } | null;
  },
  city: string | null | undefined,
  area: string | null | undefined
): boolean => {
  if (!method.serviceAreas) return true;
  const { mode = "include", cities = [], areas = [] } = method.serviceAreas;
  if (cities.length === 0 && areas.length === 0) return true;
  const cityKey = city ? normalizeLocationName(city) : "";
  const areaKey = area ? normalizeLocationName(area) : "";
  const cityAllowed = cities.some(
    (name) => normalizeLocationName(name) === cityKey
  );
  const areaAllowed = areas.some(
    (name) => normalizeLocationName(name) === areaKey
  );
  const matched = cityAllowed || areaAllowed;
  return mode === "exclude" ? !matched : matched;
};

const pickNumber = (
  own: number | null | undefined,
  inherited: number | null | undefined
): number | null => {
  const ownValue = own != null ? Number(own) : NaN;
  if (Number.isFinite(ownValue) && ownValue >= 0) return ownValue;
  const inheritedValue = inherited != null ? Number(inherited) : NaN;
  if (Number.isFinite(inheritedValue) && inheritedValue >= 0)
    return inheritedValue;
  return null;
};

const pickText = (
  ...values: (string | null | undefined)[]
): string | null => {
  for (const value of values) {
    const text = value?.trim();
    if (text) return text;
  }
  return null;
};

/** City-level charge / minimum / delivery time for one city — the values its
 *  areas inherit. Resolution: the city's own value → its division's → null. */
export function getCityPricing(
  coverage: Coverage,
  city: string | null | undefined
): AreaPricing {
  if (!coverage || !city) {
    return { deliveryCharge: null, minOrderAmount: null, deliveryTime: null };
  }
  const cityKey = normalizeLocationName(city);
  const cityEntry = coverage.cities.find(
    (c) => c.enabled && normalizeLocationName(c.name) === cityKey
  );
  const divisionEntry = cityEntry?.division
    ? coverage.divisions.find(
        (d) =>
          d.enabled &&
          normalizeLocationName(d.name) ===
            normalizeLocationName(cityEntry.division)
      )
    : undefined;
  return {
    deliveryCharge: cityEntry?.deliveryCharge != null
      ? Number(cityEntry.deliveryCharge)
      : null,
    minOrderAmount: cityEntry?.minOrderAmount != null
      ? Number(cityEntry.minOrderAmount)
      : null,
    deliveryTime: pickText(
      cityEntry?.deliveryTime,
      divisionEntry?.deliveryTime
    ),
  };
}

/** Area-wise delivery charge, minimum order amount and delivery time for one
 *  area. Charge/minimum resolve area → city → null; delivery time resolves
 *  area → city → division → null. Area/city names repeat, so the parent name
 *  narrows the match when given. */
export function getAreaPricing(
  coverage: Coverage,
  area: string | null | undefined,
  city?: string | null | undefined
): AreaPricing {
  if (!coverage || !area) {
    return { deliveryCharge: null, minOrderAmount: null, deliveryTime: null };
  }
  const areaKey = normalizeLocationName(area);
  const cityKey = city ? normalizeLocationName(city) : undefined;
  const areaEntry = coverage.areas.find(
    (a) =>
      a.enabled &&
      normalizeLocationName(a.name) === areaKey &&
      (!cityKey || !a.city || normalizeLocationName(a.city) === cityKey)
  );
  const cityEntry = cityKey
    ? coverage.cities.find(
        (c) => c.enabled && normalizeLocationName(c.name) === cityKey
      )
    : undefined;
  const divisionEntry = cityEntry?.division
    ? coverage.divisions.find(
        (d) =>
          d.enabled && normalizeLocationName(d.name) === normalizeLocationName(cityEntry.division)
      )
    : undefined;

  return {
    deliveryCharge: pickNumber(areaEntry?.deliveryCharge, cityEntry?.deliveryCharge),
    minOrderAmount: pickNumber(
      areaEntry?.minOrderAmount,
      cityEntry?.minOrderAmount
    ),
    deliveryTime: pickText(
      areaEntry?.deliveryTime,
      cityEntry?.deliveryTime,
      divisionEntry?.deliveryTime
    ),
  };
}
