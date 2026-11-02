"use client";

import { PillBadge } from "@/components/common/pill-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  getAreaPricing,
  getCityPricing,
  type AreaPricing,
  type DeliveryCoverage,
} from "@/lib/delivery-coverage";
import { cn } from "@/lib/utils";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Landmark,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

/** One node of the delivery-coverage tree. */
export interface CoverageTreeDivision {
  name: string;
  cities: { name: string; areas: string[] }[];
}

/** Compact "৳60 · min ৳500 · 24-48 hours" chip — only rendered when the
 *  city/area has at least one configured value. */
function PricingChip({
  pricing,
  className,
}: {
  pricing: AreaPricing;
  className?: string;
}) {
  const parts: string[] = [];
  if (pricing.deliveryCharge != null) parts.push(`৳${pricing.deliveryCharge}`);
  if (pricing.minOrderAmount != null)
    parts.push(`min ৳${pricing.minOrderAmount}`);
  if (pricing.deliveryTime) parts.push(pricing.deliveryTime);
  if (parts.length === 0) return null;
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-px text-[10px] font-medium tabular-nums text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
        className
      )}
      title="Fee / minimum order / delivery time from Delivery Coverage"
    >
      {parts.join(" · ")}
    </span>
  );
}

/** Small ghost button used in the toolbar and on tree rows. */
function TreeButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-xs transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/**
 * Coverage-tree picker (Delivery Coverage page design): division → city →
 * area checkboxes over the enabled coverage entries. Checking a city serves
 * it fully; checking areas under a city limits it to those areas.
 * Select all / Clear apply to the search-filtered view when searching.
 * `mode` only changes the wording and colouring: include ticks mark where the
 * method is offered, exclude ticks mark where it is hidden.
 */
export function CoverageTree({
  tree,
  cities,
  areas,
  coverage,
  mode = "include",
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
  /** Availability mode of the shipping method being edited. */
  mode?: "include" | "exclude";
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
  // During a search every match is expanded; this tracks rows the user
  // explicitly collapsed while the query is active.
  const [collapsedWhileSearching, setCollapsedWhileSearching] = useState<
    Set<string>
  >(new Set());

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const isInclude = mode === "include";

  const citySet = new Set(cities);
  const areaSet = new Set(areas);

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

  /** While searching every match is open, so the chevron toggles a collapse
   *  entry instead of the normal expansion sets. */
  const isExpanded = (key: string, base: Set<string>) =>
    searching ? !collapsedWhileSearching.has(key) : base.has(key);

  const toggleExpanded = (key: string, base: Set<string>, setBase: (next: Set<string>) => void) => {
    if (searching) {
      setCollapsedWhileSearching((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    toggleSet(base, setBase, key);
  };

  const expandEverything = () => {
    setCollapsedWhileSearching(new Set());
    setExpandedDivisions(new Set(tree.map((division) => division.name)));
    setExpandedCities(new Set(tree.flatMap((division) => division.cities.map((city) => city.name))));
  };

  const collapseEverything = () => {
    if (searching) {
      const keys = new Set<string>();
      for (const division of visibleDivisions) {
        keys.add(division.name);
        for (const city of division.visibleCities) keys.add(city.name);
      }
      setCollapsedWhileSearching(keys);
      return;
    }
    setExpandedDivisions(new Set());
    setExpandedCities(new Set());
  };

  return (
    <div className="space-y-2.5 rounded-xl border bg-background p-2.5">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCollapsedWhileSearching(new Set());
            }}
            placeholder="Search division, city or area…"
            aria-label="Search delivery coverage"
            className="h-8 bg-background pl-8 pr-8 text-sm shadow-xs"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <TreeButton
            onClick={() => onSelectVisible(allVisibleCities, allVisibleAreas)}
            disabled={allVisibleCities.length === 0 && allVisibleAreas.length === 0}
            title={
              searching
                ? `Tick every matching city${isInclude ? " (fully served)" : " (excluded)"}`
                : `Tick every city${isInclude ? " as fully served" : " as excluded"}`
            }
          >
            <Check className="size-3.5" />
            Select all
          </TreeButton>
          <TreeButton
            onClick={() => onClearVisible(allVisibleCities, allVisibleAreas)}
            disabled={allVisibleCities.length === 0 && allVisibleAreas.length === 0}
            title={searching ? "Untick every matching row" : "Untick everything"}
          >
            <X className="size-3.5" />
            Clear
          </TreeButton>
          <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
          <TreeButton
            onClick={expandEverything}
            disabled={tree.length === 0}
            title="Expand all divisions and cities"
          >
            <ChevronsUpDown className="size-3.5" />
          </TreeButton>
          <TreeButton
            onClick={collapseEverything}
            disabled={tree.length === 0}
            title="Collapse all"
          >
            <ChevronsDownUp className="size-3.5" />
          </TreeButton>
        </div>
      </div>

      <p className="px-0.5 text-[11px] text-muted-foreground">
        {searching ? (
          <>
            Select all / Clear apply to the {allVisibleCities.length} matching{" "}
            {allVisibleCities.length === 1 ? "city" : "cities"} and{" "}
            {allVisibleAreas.length} matching{" "}
            {allVisibleAreas.length === 1 ? "area" : "areas"}.
          </>
        ) : (
          isInclude
            ? "Tick a city to serve it fully, or tick areas to limit that city to those areas."
            : "Tick the cities and areas to hide this method from — everywhere else keeps it."
        )}
      </p>

      {/* Tree */}
      {visibleDivisions.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-3 py-8 text-center">
          <SearchX className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">
            {tree.length === 0
              ? "Delivery coverage is still loading…"
              : `No matches for “${query.trim()}”`}
          </p>
          {tree.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs font-medium text-primaryColor underline-offset-2 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="max-h-[26rem] space-y-2.5 overflow-y-auto pr-0.5 lg:max-h-[30rem]">
          {visibleDivisions.map((division) => {
            const fullyCount = division.cities.filter((city) =>
              citySet.has(city.name)
            ).length;
            const partialCount = division.cities.filter(
              (city) =>
                !citySet.has(city.name) &&
                city.areas.some((area) => areaSet.has(area))
            ).length;
            const selectedCount = fullyCount + partialCount;
            const divisionChecked =
              fullyCount === division.cities.length && division.cities.length > 0;
            const divisionIndeterminate =
              !divisionChecked && selectedCount > 0;
            const areaTotal = division.cities.reduce(
              (sum, city) => sum + city.areas.length,
              0
            );
            const areaSelected = division.cities.reduce(
              (sum, city) =>
                sum + city.areas.filter((area) => areaSet.has(area)).length,
              0
            );

            const expanded = isExpanded(division.name, expandedDivisions);
            return (
              <div
                key={division.name}
                className={cn(
                  "overflow-hidden rounded-xl border bg-card transition-colors",
                  selectedCount > 0 && "border-primaryColor/30"
                )}
              >
                <div className="flex items-center gap-2 p-2">
                  <Checkbox
                    checked={
                      divisionIndeterminate ? "indeterminate" : divisionChecked
                    }
                    onCheckedChange={() =>
                      onToggleDivision(division.cities, divisionChecked !== true)
                    }
                    aria-label={`Select every city in ${division.name}`}
                    title={
                      divisionChecked
                        ? `Untick every city in ${division.name}`
                        : `Tick every city in ${division.name} as ${isInclude ? "fully served" : "excluded"}`
                    }
                    className="size-4 shrink-0 rounded-[4px]"
                  />
                  <span
                    className={cn(
                      "hidden size-7 shrink-0 items-center justify-center rounded-md sm:flex",
                      selectedCount > 0
                        ? "bg-primaryColor/10 text-primaryColor"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Landmark className="size-3.5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const willExpand = !expanded;
                      toggleExpanded(
                        division.name,
                        expandedDivisions,
                        setExpandedDivisions
                      );
                      if (!willExpand) return;
                      // Opening a division also reveals the cities that carry
                      // area-level selections, so their ticks are visible.
                      const areaOnlyCities = division.cities
                        .filter(
                          (city) =>
                            !citySet.has(city.name) &&
                            city.areas.some((area) => areaSet.has(area))
                        )
                        .map((city) => city.name);
                      if (areaOnlyCities.length > 0) {
                        setExpandedCities((prev) => {
                          const next = new Set(prev);
                          for (const name of areaOnlyCities) next.add(name);
                          return next;
                        });
                      }
                    }}
                    aria-expanded={expanded}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        !expanded && "-rotate-90"
                      )}
                    />
                    <span className="truncate text-sm font-semibold">
                      {division.name}
                    </span>
                    <span className="hidden shrink-0 text-[11px] tabular-nums text-muted-foreground md:inline">
                      {division.cities.length} cit{division.cities.length === 1 ? "y" : "ies"}
                      {areaTotal > 0 && ` · ${areaTotal} areas`}
                    </span>
                  </button>
                  {selectedCount > 0 ? (
                    <PillBadge tone="emerald" className="shrink-0">
                      {selectedCount}/{division.cities.length} cities
                      <span className="hidden lg:inline">
                        {areaSelected > 0 ? ` · ${areaSelected} areas` : ""}
                      </span>
                    </PillBadge>
                  ) : (
                    <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                      None selected
                    </span>
                  )}
                </div>

                {expanded && (
                  <div className="space-y-2 border-t bg-muted/20 p-2">
                    {division.visibleCities.length === 0 && (
                      <p className="px-1 py-2 text-xs text-muted-foreground">
                        No matching cities in {division.name}.
                      </p>
                    )}
                    {division.visibleCities.map((city) => {
                      const fully = citySet.has(city.name);
                      const citySelectedAreas = city.visibleAreas.filter((area) =>
                        areaSet.has(area)
                      ).length;
                      const cityIndeterminate = !fully && citySelectedAreas > 0;
                      const cityExpanded = isExpanded(city.name, expandedCities);
                      return (
                        <div
                          key={city.name}
                          className={cn(
                            "overflow-hidden rounded-lg border bg-background transition-colors",
                            fully || citySelectedAreas > 0
                              ? "border-primaryColor/25"
                              : "border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 p-1.5">
                            <Checkbox
                              checked={cityIndeterminate ? "indeterminate" : fully}
                              onCheckedChange={() =>
                                onToggleCity(city.name, city.areas, fully !== true)
                              }
                              aria-label={`Select ${city.name}`}
                              title={
                                fully
                                  ? `Untick ${city.name}`
                                  : `Mark ${city.name} ${isInclude ? "as fully served" : "as excluded"}`
                              }
                              className="size-3.5 shrink-0 rounded-[3px]"
                            />
                            <span
                              className={cn(
                                "hidden size-6 shrink-0 items-center justify-center rounded-md sm:flex",
                                fully || citySelectedAreas > 0
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Building2 className="size-3" />
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                toggleExpanded(
                                  city.name,
                                  expandedCities,
                                  setExpandedCities
                                )
                              }
                              aria-expanded={cityExpanded}
                              className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                            >
                              <ChevronDown
                                className={cn(
                                  "size-3.5 shrink-0 text-muted-foreground transition-transform",
                                  !cityExpanded && "-rotate-90"
                                )}
                              />
                              <span className="truncate text-sm font-medium">
                                {city.name}
                              </span>
                              {fully && (
                                <PillBadge
                                  tone={isInclude ? "emerald" : "amber"}
                                  className="shrink-0"
                                >
                                  {isInclude ? "Fully served" : "Excluded"}
                                </PillBadge>
                              )}
                              {!fully && citySelectedAreas > 0 && (
                                <PillBadge
                                  tone={isInclude ? "blue" : "amber"}
                                  className="shrink-0"
                                >
                                  {citySelectedAreas}/{city.areas.length} areas
                                </PillBadge>
                              )}
                              {coverage && (
                                <PricingChip
                                  pricing={getCityPricing(coverage, city.name)}
                                  className="hidden md:inline-flex"
                                />
                              )}
                            </button>
                            {onSelectAllAreas && city.areas.length > 0 && (
                              <TreeButton
                                onClick={() =>
                                  onSelectAllAreas(city.name, city.areas)
                                }
                                title={
                                  city.areas.every((area) => areaSet.has(area))
                                    ? `Untick every area in ${city.name}`
                                    : `Tick every area in ${city.name}`
                                }
                              >
                                {city.areas.every((area) => areaSet.has(area))
                                  ? "Clear areas"
                                  : "All areas"}
                              </TreeButton>
                            )}
                          </div>

                          {cityExpanded && city.visibleAreas.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 border-t bg-muted/20 px-2 py-2 pl-10">
                              {city.visibleAreas.map((area) => {
                                const selected = areaSet.has(area);
                                return (
                                  <label
                                    key={area}
                                    className={cn(
                                      "flex max-w-48 cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs transition-colors",
                                      selected
                                        ? isInclude
                                          ? "border-primaryColor/40 bg-primaryColor/10 font-medium"
                                          : "border-amber-500/40 bg-amber-500/10 font-medium"
                                        : "bg-background hover:bg-muted/60"
                                    )}
                                  >
                                    <Checkbox
                                      checked={selected}
                                      onCheckedChange={() =>
                                        onToggleArea(
                                          city.name,
                                          area,
                                          !areaSet.has(area)
                                        )
                                      }
                                      className="size-3 rounded-[3px]"
                                    />
                                    <span className="truncate" title={area}>
                                      {area}
                                    </span>
                                    {coverage && (
                                      <PricingChip
                                        pricing={getAreaPricing(
                                          coverage,
                                          area,
                                          city.name
                                        )}
                                        className="hidden md:inline-flex"
                                      />
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {cityExpanded && city.visibleAreas.length === 0 && (
                            <p className="border-t bg-muted/20 px-2 py-2 pl-10 text-[11px] text-muted-foreground">
                              {searching
                                ? "No matching areas in this city."
                                : "No areas configured for this city — tick the city to serve it fully."}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
