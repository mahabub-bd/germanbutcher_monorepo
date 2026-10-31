"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  getAreaPricing,
  getCityPricing,
  type AreaPricing,
  type DeliveryCoverage,
} from "@/lib/delivery-coverage";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/** One node of the delivery-coverage tree. */
export interface CoverageTreeDivision {
  name: string;
  cities: { name: string; areas: string[] }[];
}

/** Compact "৳60 · min ৳500 · 24-48 hours" chip — only rendered when the
 *  city/area has at least one configured value. */
function PricingChip({ pricing }: { pricing: AreaPricing }) {
  const parts: string[] = [];
  if (pricing.deliveryCharge != null) parts.push(`৳${pricing.deliveryCharge}`);
  if (pricing.minOrderAmount != null)
    parts.push(`min ৳${pricing.minOrderAmount}`);
  if (pricing.deliveryTime) parts.push(pricing.deliveryTime);
  if (parts.length === 0) return null;
  return (
    <span
      className="shrink-0 whitespace-nowrap text-[10px] font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
      title="Fee / minimum order / delivery time from Delivery Coverage"
    >
      {parts.join(" · ")}
    </span>
  );
}

/**
 * Coverage-tree picker (Delivery Coverage page design): division → city →
 * area checkboxes over the enabled coverage entries. Checking a city serves
 * it fully; checking areas under a city limits it to those areas.
 * Select all / Clear apply to the search-filtered view when searching.
 */
export function CoverageTree({
  tree,
  cities,
  areas,
  coverage,
  onToggleCity,
  onToggleArea,
  onToggleDivision,
  onSelectAllAreas,
  onSelectVisible,
  onClearVisible,
}: {
  tree: CoverageTreeDivision[];
  cities: string[];
  areas: string[];
  /** Delivery-coverage data — when given, city/area rows show the resolved
   *  fee / minimum order / delivery time chips. */
  coverage?: DeliveryCoverage | null;
  onToggleCity: (cityName: string, cityAreas: string[], full: boolean) => void;
  onToggleArea: (cityName: string, areaName: string, selected: boolean) => void;
  onToggleDivision: (
    divisionCities: { name: string; areas: string[] }[],
    full: boolean
  ) => void;
  /** Tick every area of one city at once (city becomes area-limited). */
  onSelectAllAreas?: (cityName: string, cityAreas: string[]) => void;
  onSelectVisible: (cities: string[], areas: string[]) => void;
  onClearVisible: (cities: string[], areas: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set()
  );
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const matches = (text: string) => text.toLowerCase().includes(q);

  // Search-filtered view (used for rendering AND the select-all/clear scope).
  const visibleDivisions = tree
    .map((division) => {
      const visibleCities = division.cities
        .map((city) => ({
          ...city,
          visibleAreas: searching
            ? city.areas.filter((area) => matches(area))
            : city.areas,
        }))
        .filter(
          (city) => !searching || matches(city.name) || city.visibleAreas.length > 0
        );
      return { ...division, visibleCities };
    })
    .filter(
      (division) =>
        !searching || matches(division.name) || division.visibleCities.length > 0
    );

  const allVisibleCities = visibleDivisions.flatMap((division) =>
    division.visibleCities.map((city) => city.name)
  );
  const allVisibleAreas = visibleDivisions.flatMap((division) =>
    division.visibleCities.flatMap((city) => city.visibleAreas)
  );

  const toggleSet = (
    set: Set<string>,
    setSetter: (next: Set<string>) => void,
    key: string
  ) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSetter(next);
  };

  return (
    <div className="space-y-2 rounded-lg border bg-background p-2">
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search division, city or area…"
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={() => onSelectVisible(allVisibleCities, allVisibleAreas)}
          disabled={allVisibleCities.length === 0 && allVisibleAreas.length === 0}
          className="shrink-0 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          title={
            searching
              ? "Tick every matching city (fully served)"
              : "Tick every city as fully served"
          }
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => onClearVisible(allVisibleCities, allVisibleAreas)}
          disabled={allVisibleCities.length === 0 && allVisibleAreas.length === 0}
          className="shrink-0 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          title={
            searching
              ? "Untick every matching city and area"
              : "Untick everything"
          }
        >
          Clear
        </button>
      </div>
      {searching && (
        <p className="text-[11px] text-muted-foreground">
          Select all / Clear apply to the {allVisibleCities.length} matching
          {allVisibleCities.length === 1 ? " city" : " cities"} and{" "}
          {allVisibleAreas.length} matching{" "}
          {allVisibleAreas.length === 1 ? "area" : "areas"}.
        </p>
      )}
      <div className="max-h-105 divide-y overflow-y-auto rounded-md border">
        {tree.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Delivery coverage is still loading…
          </p>
        )}
        {visibleDivisions.map((division) => {
          const fullyCount = division.cities.filter((city) =>
            cities.includes(city.name)
          ).length;
          const partialCount = division.cities.filter(
            (city) =>
              !cities.includes(city.name) &&
              city.areas.some((area) => areas.includes(area))
          ).length;
          const divisionChecked =
            fullyCount === division.cities.length && division.cities.length > 0;
          const divisionIndeterminate =
            !divisionChecked && (fullyCount > 0 || partialCount > 0);

          const expanded = searching || expandedDivisions.has(division.name);
          return (
            <div key={division.name}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Checkbox
                  checked={
                    divisionIndeterminate ? "indeterminate" : divisionChecked
                  }
                  onCheckedChange={() =>
                    onToggleDivision(division.cities, divisionChecked !== true)
                  }
                  className="size-3.5 rounded-[3px]"
                />
                <button
                  type="button"
                  onClick={() =>
                    toggleSet(
                      expandedDivisions,
                      setExpandedDivisions,
                      division.name
                    )
                  }
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                >
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 text-muted-foreground transition-transform",
                      !expanded && "-rotate-90"
                    )}
                  />
                  <span className="truncate text-sm font-medium">
                    {division.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {fullyCount + partialCount > 0
                      ? `${fullyCount + partialCount}/${division.cities.length} selected`
                      : `${division.cities.length} cities`}
                  </span>
                </button>
                {division.cities.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onToggleDivision(division.cities, divisionChecked !== true)
                    }
                    className="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    title={
                      divisionChecked
                        ? `Untick every city in ${division.name}`
                        : `Tick every city in ${division.name} as fully served`
                    }
                  >
                    {divisionChecked ? "None" : "All"}
                  </button>
                )}
              </div>

              {expanded &&
                division.visibleCities.map((city) => {
                  const fully = cities.includes(city.name);
                  const citySelectedAreas = city.visibleAreas.filter((area) =>
                    areas.includes(area)
                  ).length;
                  const cityIndeterminate = !fully && citySelectedAreas > 0;
                  const cityExpanded =
                    searching ||
                    citySelectedAreas > 0 ||
                    expandedCities.has(city.name);
                  return (
                    <div key={city.name} className="border-t bg-muted/20">
                      <div className="flex items-center gap-2 px-2 py-1.5 pl-7">
                        <Checkbox
                          checked={cityIndeterminate ? "indeterminate" : fully}
                          onCheckedChange={() =>
                            onToggleCity(city.name, city.areas, fully !== true)
                          }
                          className="size-3.5 rounded-[3px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            toggleSet(
                              expandedCities,
                              setExpandedCities,
                              city.name
                            )
                          }
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        >
                          <ChevronDown
                            className={cn(
                              "size-3.5 shrink-0 text-muted-foreground transition-transform",
                              !cityExpanded && "-rotate-90"
                            )}
                          />
                          <span className="truncate text-sm">{city.name}</span>
                          {citySelectedAreas > 0 && (
                            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                              {citySelectedAreas}/{city.areas.length} areas
                            </span>
                          )}
                          {coverage && (
                            <PricingChip
                              pricing={getCityPricing(coverage, city.name)}
                            />
                          )}
                        </button>
                        {onSelectAllAreas && city.areas.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectAllAreas(city.name, city.areas)
                            }
                            className="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                            title={
                              city.areas.every((area) => areas.includes(area))
                                ? `Untick every area in ${city.name}`
                                : `Tick every area in ${city.name}`
                            }
                          >
                            {city.areas.every((area) => areas.includes(area))
                              ? "Clear areas"
                              : "All areas"}
                          </button>
                        )}
                      </div>

                      {cityExpanded && city.visibleAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1 px-2 py-1.5 pl-12">
                          {city.visibleAreas.map((area) => (
                            <label
                              key={area}
                              className={cn(
                                "flex cursor-pointer select-none items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs shadow-xs transition-colors hover:bg-muted/60",
                                areas.includes(area) &&
                                "border-primaryColor/40 bg-primaryColor/5"
                              )}
                            >
                              <Checkbox
                                checked={areas.includes(area)}
                                onCheckedChange={() =>
                                  onToggleArea(
                                    city.name,
                                    area,
                                    !areas.includes(area)
                                  )
                                }
                                className="size-3 rounded-[3px]"
                              />
                              {area}
                              {coverage && (
                                <PricingChip
                                  pricing={getAreaPricing(
                                    coverage,
                                    area,
                                    city.name
                                  )}
                                />
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
