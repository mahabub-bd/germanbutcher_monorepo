"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  normalizeCoverage,
  type CoverageArea,
  type CoverageCity,
  type CoverageDivision,
} from "@/lib/delivery-coverage";
import { cn } from "@/lib/utils";
import { fetchData, patchData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Landmark,
  Loader2,
  MapPin,
  MapPinOff,
  MoreHorizontal,
  Pencil,
  Plus,
  PowerOff,
  Save,
  Search,
  Trash2,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Coverage = NonNullable<BusinessSettings["deliveryCoverage"]>;
type Level = "division" | "city";

interface AddTarget {
  level: "division" | "city" | "area";
  division?: string;
  city?: string;
}

interface EditTarget {
  level: Level;
  name: string;
  division?: string;
}

interface DeleteTarget {
  level: "division" | "city" | "area";
  name: string;
  division?: string;
  city?: string;
}

interface CityNode {
  city: CoverageCity;
  areas: CoverageArea[];
}

interface DivisionNode {
  division: CoverageDivision;
  cities: CityNode[];
}

const EMPTY_COVERAGE: Coverage = {
  divisions: [],
  cities: [],
  areas: [],
};

const MENU_URL = "/admin/settings/delivery-coverage";

function toggleInSet(set: Set<string>, value: string) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function percentOf(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

/** Checked when everything is enabled, mixed when only some are, unchecked
 *  when nothing is — used by the select-all style checkboxes. */
function checkboxState(
  enabled: number,
  total: number,
): boolean | "indeterminate" {
  if (total <= 0 || enabled <= 0) return false;
  return enabled >= total ? true : "indeterminate";
}

function domId(...parts: string[]) {
  return parts.join("-").replace(/[^a-zA-Z0-9_-]+/g, "-");
}

/** Standalone delivery-coverage manager. Divisions, cities and areas live
 *  as plain lists in Business Settings (seeded from the bundled Bangladesh
 *  dataset on first load). Everything supports add / delete / on-off, with
 *  inline rename for divisions and cities — saved with Save Changes. */
export function DeliveryCoverageCard() {
  const { can } = usePermissions();
  const [coverage, setCoverage] = useState<Coverage>(EMPTY_COVERAGE);
  const [savedCoverage, setSavedCoverage] = useState<Coverage>(EMPTY_COVERAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  // During a search every match is expanded; this tracks rows the user
  // explicitly collapsed while the query is active.
  const [collapsedWhileSearching, setCollapsedWhileSearching] = useState<
    Set<string>
  >(new Set());
  // Inline add: which level is adding and under which parent.
  const [adding, setAdding] = useState<AddTarget | null>(null);
  const [addValue, setAddValue] = useState("");
  // Inline rename.
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editValue, setEditValue] = useState("");
  // Delete confirmation.
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    let active = true;
    fetchData<BusinessSettings>("business-settings")
      .then((settings) => {
        if (!active) return;
        const normalized = normalizeCoverage(settings?.deliveryCoverage);
        setCoverage(normalized);
        setSavedCoverage(normalized);
      })
      .catch((error) => {
        console.error("Error fetching business settings:", error);
        toast.error("Failed to load delivery coverage");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const mutate = (fn: (prev: Coverage) => Coverage) => {
    setCoverage((prev) => fn(prev));
  };

  const isDirty = useMemo(
    () => JSON.stringify(coverage) !== JSON.stringify(savedCoverage),
    [coverage, savedCoverage],
  );

  // Warn before leaving with unsaved coverage edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // --- Derived data -------------------------------------------------------

  const { citiesByDivision, areasByCity } = useMemo(() => {
    const citiesByDivision = new Map<string, CoverageCity[]>();
    for (const city of coverage.cities) {
      const list = citiesByDivision.get(city.division) ?? [];
      list.push(city);
      citiesByDivision.set(city.division, list);
    }
    const areasByCity = new Map<string, CoverageArea[]>();
    for (const area of coverage.areas) {
      const list = areasByCity.get(area.city) ?? [];
      list.push(area);
      areasByCity.set(area.city, list);
    }
    return { citiesByDivision, areasByCity };
  }, [coverage]);

  const totals = useMemo(
    () => ({
      divisions: coverage.divisions.length,
      enabledDivisions: coverage.divisions.filter((d) => d.enabled).length,
      cities: coverage.cities.length,
      enabledCities: coverage.cities.filter((c) => c.enabled).length,
      areas: coverage.areas.length,
      enabledAreas: coverage.areas.filter((a) => a.enabled).length,
    }),
    [coverage],
  );

  // Areas that actually reach checkout — their area, city and division are on.
  const liveAreas = useMemo(() => {
    const enabledDivisions = new Set(
      coverage.divisions.filter((d) => d.enabled).map((d) => d.name),
    );
    const enabledCities = new Map(
      coverage.cities.filter((c) => c.enabled).map((c) => [c.name, c.division]),
    );
    return coverage.areas.filter((area) => {
      if (!area.enabled) return false;
      const division = enabledCities.get(area.city);
      return division !== undefined && enabledDivisions.has(division);
    }).length;
  }, [coverage]);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const tree = useMemo<DivisionNode[]>(() => {
    const match = (value: string) =>
      value.toLowerCase().includes(normalizedQuery);

    if (!normalizedQuery) {
      return coverage.divisions.map((division) => ({
        division,
        cities: (citiesByDivision.get(division.name) ?? []).map((city) => ({
          city,
          areas: areasByCity.get(city.name) ?? [],
        })),
      }));
    }

    return coverage.divisions.flatMap((division) => {
      const divisionMatches = match(division.name);
      const cities = (citiesByDivision.get(division.name) ?? []).flatMap(
        (city) => {
          const cityMatches = match(city.name);
          const areas = areasByCity.get(city.name) ?? [];
          // If the division or city name matches, show everything below it;
          // otherwise narrow down to the matching areas only.
          const visibleAreas =
            divisionMatches || cityMatches
              ? areas
              : areas.filter((area) => match(area.name));
          if (!divisionMatches && !cityMatches && visibleAreas.length === 0) {
            return [];
          }
          return [{ city, areas: visibleAreas }];
        },
      );
      if (!divisionMatches && cities.length === 0) return [];
      return [{ division, cities }];
    });
  }, [coverage.divisions, normalizedQuery, citiesByDivision, areasByCity]);

  const searchCounts = useMemo(() => {
    if (!isSearching) return null;
    let cities = 0;
    let areas = 0;
    for (const node of tree) {
      cities += node.cities.length;
      for (const cityNode of node.cities) areas += cityNode.areas.length;
    }
    return { divisions: tree.length, cities, areas };
  }, [isSearching, tree]);

  // --- Expansion ----------------------------------------------------------

  const divisionKey = (name: string) => `d:${name}`;
  const cityKey = (division: string, city: string) => `c:${division}::${city}`;

  const isNodeExpanded = (key: string, level: Level) => {
    if (isSearching) return !collapsedWhileSearching.has(key);
    return level === "division"
      ? expandedDivisions.has(key)
      : expandedCities.has(key);
  };

  const toggleNode = (key: string, level: Level) => {
    if (isSearching) {
      setCollapsedWhileSearching((prev) => toggleInSet(prev, key));
      return;
    }
    if (level === "division") {
      setExpandedDivisions((prev) => toggleInSet(prev, key));
    } else {
      setExpandedCities((prev) => toggleInSet(prev, key));
    }
  };

  const expandAllDivisions = () => {
    setCollapsedWhileSearching(new Set());
    setExpandedDivisions(
      new Set(coverage.divisions.map((division) => divisionKey(division.name))),
    );
  };

  const collapseAll = () => {
    if (isSearching) {
      const keys = new Set<string>();
      for (const node of tree) {
        keys.add(divisionKey(node.division.name));
        for (const cityNode of node.cities) {
          keys.add(cityKey(node.division.name, cityNode.city.name));
        }
      }
      setCollapsedWhileSearching(keys);
      return;
    }
    setExpandedDivisions(new Set());
    setExpandedCities(new Set());
  };

  const remapExpansionAfterRename = (
    level: Level,
    oldName: string,
    newName: string,
    division?: string,
  ) => {
    if (level === "division") {
      setExpandedDivisions((prev) => {
        const next = new Set(prev);
        if (next.delete(divisionKey(oldName))) {
          next.add(divisionKey(newName));
        }
        return next;
      });
      setExpandedCities((prev) => {
        const oldPrefix = `c:${oldName}::`;
        const newPrefix = `c:${newName}::`;
        return new Set(
          Array.from(prev, (key) =>
            key.startsWith(oldPrefix)
              ? `${newPrefix}${key.slice(oldPrefix.length)}`
              : key,
          ),
        );
      });
    } else if (division) {
      setExpandedCities((prev) => {
        const next = new Set(prev);
        const oldKey = cityKey(division, oldName);
        if (next.delete(oldKey)) next.add(cityKey(division, newName));
        return next;
      });
    }
  };

  // --- CRUD operations (list-based) --------------------------------------

  const startAdding = (target: AddTarget) => {
    setAdding(target);
    setAddValue("");
    setEditing(null);
  };

  const cancelAdding = () => {
    setAdding(null);
    setAddValue("");
  };

  const addEntry = () => {
    if (!adding) return;
    const raw = addValue.trim();
    if (!raw) return;

    // Areas accept a comma-separated batch; divisions/cities stay single.
    const names =
      adding.level === "area"
        ? Array.from(
            new Map(
              raw
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
                .map((value) => [value.toLowerCase(), value] as const),
            ).values(),
          )
        : [raw];
    if (names.length === 0) return;

    const exists = (list: string[]) =>
      list.some((item) => item.toLowerCase() === names[0].toLowerCase());

    if (adding.level === "division") {
      const name = names[0];
      if (exists(coverage.divisions.map((division) => division.name))) {
        toast.error(`Division "${name}" already exists`);
        return;
      }
      mutate((prev) => ({
        ...prev,
        divisions: [...prev.divisions, { name, enabled: true }],
      }));
      setExpandedDivisions((prev) => new Set(prev).add(divisionKey(name)));
    } else if (adding.level === "city" && adding.division) {
      const division = adding.division;
      const name = names[0];
      if (exists(coverage.cities.map((city) => city.name))) {
        toast.error(`City "${name}" already exists`);
        return;
      }
      mutate((prev) => ({
        ...prev,
        cities: [...prev.cities, { division, name, enabled: true }],
      }));
      // Open the new city so areas can be added straight away.
      setExpandedCities((prev) => new Set(prev).add(cityKey(division, name)));
    } else if (adding.level === "area" && adding.city) {
      const city = adding.city;
      const existing = new Set(
        coverage.areas
          .filter((area) => area.city === city)
          .map((area) => area.name.toLowerCase()),
      );
      const fresh = names.filter((name) => !existing.has(name.toLowerCase()));
      if (fresh.length === 0) {
        toast.error(
          names.length === 1
            ? `Area "${names[0]}" already exists in ${city}`
            : "Those areas already exist in this city",
        );
        return;
      }
      mutate((prev) => ({
        ...prev,
        areas: [
          ...prev.areas,
          ...fresh.map((name) => ({ city, name, enabled: true })),
        ],
      }));
      if (fresh.length !== names.length) {
        toast.info(
          `Added ${fresh.length} ${
            fresh.length === 1 ? "area" : "areas"
          } — duplicates were skipped`,
        );
      }
    }

    setAdding(null);
    setAddValue("");
  };

  const startEditing = (target: EditTarget) => {
    setEditing(target);
    setEditValue(target.name);
    setAdding(null);
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditValue("");
  };

  const commitRename = () => {
    const name = editValue.trim();
    if (!name || !editing) return;
    if (name === editing.name) {
      cancelEditing();
      return;
    }

    if (editing.level === "division") {
      const oldName = editing.name;
      if (
        coverage.divisions.some(
          (division) =>
            division.name.toLowerCase() === name.toLowerCase() &&
            division.name !== oldName,
        )
      ) {
        toast.error(`Division "${name}" already exists`);
        return;
      }
      mutate((prev) => ({
        ...prev,
        divisions: prev.divisions.map((division) =>
          division.name === oldName ? { ...division, name } : division,
        ),
        // Children follow the renamed parent.
        cities: prev.cities.map((city) =>
          city.division === oldName ? { ...city, division: name } : city,
        ),
      }));
      remapExpansionAfterRename("division", oldName, name);
    } else if (editing.level === "city" && editing.division) {
      const oldName = editing.name;
      const division = editing.division;
      if (
        coverage.cities.some(
          (city) =>
            city.name.toLowerCase() === name.toLowerCase() &&
            city.name !== oldName,
        )
      ) {
        toast.error(`City "${name}" already exists`);
        return;
      }
      mutate((prev) => ({
        ...prev,
        cities: prev.cities.map((city) =>
          city.name === oldName ? { ...city, name } : city,
        ),
        areas: prev.areas.map((area) =>
          area.city === oldName ? { ...area, city: name } : area,
        ),
      }));
      remapExpansionAfterRename("city", oldName, name, division);
    }

    cancelEditing();
  };

  const deleteDivision = (name: string) => {
    mutate((prev) => ({
      ...prev,
      divisions: prev.divisions.filter((division) => division.name !== name),
      cities: prev.cities.filter((city) => city.division !== name),
      areas: prev.areas.filter(
        (area) =>
          !prev.cities.some(
            (city) => city.division === name && city.name === area.city,
          ),
      ),
    }));
  };

  const deleteCity = (name: string) => {
    mutate((prev) => ({
      ...prev,
      cities: prev.cities.filter((city) => city.name !== name),
      areas: prev.areas.filter((area) => area.city !== name),
    }));
  };

  const deleteArea = (city: string, name: string) => {
    mutate((prev) => ({
      ...prev,
      areas: prev.areas.filter(
        (area) => !(area.city === city && area.name === name),
      ),
    }));
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.level === "division") {
      deleteDivision(pendingDelete.name);
    } else if (pendingDelete.level === "city") {
      deleteCity(pendingDelete.name);
    } else if (pendingDelete.city) {
      deleteArea(pendingDelete.city, pendingDelete.name);
    }
    setPendingDelete(null);
  };

  // --- Bulk / branch toggles ---------------------------------------------

  const setEverything = (enabled: boolean) => {
    mutate((prev) => ({
      ...prev,
      divisions: prev.divisions.map((division) => ({ ...division, enabled })),
      cities: prev.cities.map((city) => ({ ...city, enabled })),
      areas: prev.areas.map((area) => ({ ...area, enabled })),
    }));
  };

  const setDivisionBranch = (divisionName: string, enabled: boolean) => {
    mutate((prev) => {
      const cityNames = new Set(
        prev.cities
          .filter((city) => city.division === divisionName)
          .map((city) => city.name),
      );
      return {
        ...prev,
        divisions: prev.divisions.map((division) =>
          division.name === divisionName ? { ...division, enabled } : division,
        ),
        cities: prev.cities.map((city) =>
          city.division === divisionName ? { ...city, enabled } : city,
        ),
        areas: prev.areas.map((area) =>
          cityNames.has(area.city) ? { ...area, enabled } : area,
        ),
      };
    });
  };

  const setCityBranch = (cityName: string, enabled: boolean) => {
    mutate((prev) => ({
      ...prev,
      cities: prev.cities.map((city) =>
        city.name === cityName ? { ...city, enabled } : city,
      ),
      areas: prev.areas.map((area) =>
        area.city === cityName ? { ...area, enabled } : area,
      ),
    }));
  };

  /** Select-all for the city cards of one division — toggles the cities and
   *  their areas without touching the division's own flag. */
  const setDivisionCities = (divisionName: string, enabled: boolean) => {
    mutate((prev) => {
      const cityNames = new Set(
        prev.cities
          .filter((city) => city.division === divisionName)
          .map((city) => city.name),
      );
      return {
        ...prev,
        cities: prev.cities.map((city) =>
          city.division === divisionName ? { ...city, enabled } : city,
        ),
        areas: prev.areas.map((area) =>
          cityNames.has(area.city) ? { ...area, enabled } : area,
        ),
      };
    });
  };

  /** Select-all for the area cards of one city — leaves the city flag alone. */
  const setCityAreas = (cityName: string, enabled: boolean) => {
    mutate((prev) => ({
      ...prev,
      areas: prev.areas.map((area) =>
        area.city === cityName ? { ...area, enabled } : area,
      ),
    }));
  };

  const toggleArea = (cityName: string, areaName: string) => {
    mutate((prev) => ({
      ...prev,
      areas: prev.areas.map((area) =>
        area.city === cityName && area.name === areaName
          ? { ...area, enabled: !area.enabled }
          : area,
      ),
    }));
  };

  // --- Save / discard -----------------------------------------------------

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await patchData<BusinessSettings>("business-settings", {
        deliveryCoverage: coverage,
      });
      setSavedCoverage(coverage);
      toast.success("Delivery coverage saved");
    } catch (error) {
      console.error("Error saving delivery coverage:", error);
      toast.error("Failed to save delivery coverage");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setCoverage(savedCoverage);
    setAdding(null);
    setEditing(null);
    setAddValue("");
    setEditValue("");
    toast.info("Changes discarded");
  };

  const onSearchChange = (value: string) => {
    setQuery(value);
    setCollapsedWhileSearching(new Set());
    if (value.trim()) {
      // Stale inline forms would otherwise reappear after clearing search.
      setAdding(null);
      setEditing(null);
      setAddValue("");
      setEditValue("");
    }
  };

  const canEdit = can(MENU_URL, "canEdit");

  const deleteCopy = useMemo(() => {
    if (!pendingDelete) return null;
    if (pendingDelete.level === "division") {
      const cities = coverage.cities.filter(
        (city) => city.division === pendingDelete.name,
      );
      const areaCount = cities.reduce(
        (sum, city) => sum + (areasByCity.get(city.name)?.length ?? 0),
        0,
      );
      return {
        title: `Delete "${pendingDelete.name}"?`,
        description: `This removes the division, ${cities.length} ${
          cities.length === 1 ? "city" : "cities"
        } and ${areaCount} ${
          areaCount === 1 ? "area" : "areas"
        } from your coverage list. This cannot be undone.`,
      };
    }
    if (pendingDelete.level === "city") {
      const areaCount = areasByCity.get(pendingDelete.name)?.length ?? 0;
      return {
        title: `Delete "${pendingDelete.name}"?`,
        description: `This removes the city and its ${areaCount} ${
          areaCount === 1 ? "area" : "areas"
        } from your coverage list. This cannot be undone.`,
      };
    }
    return {
      title: `Delete "${pendingDelete.name}"?`,
      description: `This area will be removed from ${
        pendingDelete.city ?? "this city"
      }. This cannot be undone.`,
    };
  }, [pendingDelete, coverage.cities, areasByCity]);

  // --- Render -------------------------------------------------------------

  const overallTotal = totals.divisions + totals.cities + totals.areas;
  const overallEnabled =
    totals.enabledDivisions + totals.enabledCities + totals.enabledAreas;

  return (
    <div className={cn("space-y-6 rounded-sm p-2 md:p-4", isDirty && "pb-28")}>
      <PageHeader
        title="Delivery Coverage"
        description="Decide exactly where you deliver. Only checked areas appear on checkout and customer address forms."
        titleIcon={<MapPin className="size-6" />}
      >
        {isDirty && (
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </Badge>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleDiscard}
          disabled={!isDirty || isSaving || !canEdit}
        >
          <Undo2 className="size-4 sm:mr-2" />
          <span className="hidden sm:inline">Discard</span>
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading || !isDirty || isSaving || !canEdit}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <Save className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Save changes</span>
            </>
          )}
        </Button>
      </PageHeader>

      {!isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatsCard
            icon={Landmark}
            title="Divisions"
            value={totals.enabledDivisions}
            count={String(totals.divisions)}
            description={`${percentOf(
              totals.enabledDivisions,
              totals.divisions,
            )}% enabled`}
            bgColor="indigo"
          />
          <StatsCard
            icon={Building2}
            title="Cities"
            value={totals.enabledCities}
            count={String(totals.cities)}
            description={`${percentOf(
              totals.enabledCities,
              totals.cities,
            )}% enabled`}
            bgColor="blue"
          />
          <StatsCard
            icon={MapPin}
            title="Areas"
            value={totals.enabledAreas}
            count={String(totals.areas)}
            description={`${percentOf(
              totals.enabledAreas,
              totals.areas,
            )}% enabled`}
            bgColor="green"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
              <MapPin className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">
                Servable areas
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Unchecked entries stay saved but are hidden from customers.
              </p>
            </div>
          </div>
          {!isLoading && (
            <Badge
              variant="outline"
              className="w-fit shrink-0 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {liveAreas} {liveAreas === 1 ? "area" : "areas"} live
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingIndicator message="Loading delivery coverage..." />
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search divisions, cities or areas..."
                  aria-label="Search delivery coverage"
                  className="h-9 bg-background pl-9 pr-9 shadow-xs"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => onSearchChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <label
                  className={cn(
                    "flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border bg-background px-2.5 text-sm shadow-xs transition-colors hover:bg-muted/50",
                    !canEdit && "cursor-not-allowed opacity-60",
                  )}
                  title="Mark or unmark every division, city and area"
                >
                  <Checkbox
                    checked={checkboxState(overallEnabled, overallTotal)}
                    disabled={!canEdit || overallTotal === 0}
                    onCheckedChange={(value) => setEverything(value === true)}
                    aria-label="Select all delivery coverage"
                  />
                  <span className="font-medium">Select all</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {overallEnabled}/{overallTotal}
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-9 text-muted-foreground"
                  onClick={expandAllDivisions}
                  disabled={coverage.divisions.length === 0}
                  title="Expand all divisions"
                  aria-label="Expand all divisions"
                >
                  <ChevronsUpDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-9 text-muted-foreground"
                  onClick={collapseAll}
                  disabled={coverage.divisions.length === 0}
                  title="Collapse all"
                  aria-label="Collapse all"
                >
                  <ChevronsDownUp className="size-4" />
                </Button>
              </div>
            </div>

            {searchCounts && (
              <p className="text-xs text-muted-foreground" role="status">
                {searchCounts.divisions}{" "}
                {searchCounts.divisions === 1 ? "division" : "divisions"} ·{" "}
                {searchCounts.cities}{" "}
                {searchCounts.cities === 1 ? "city" : "cities"} ·{" "}
                {searchCounts.areas}{" "}
                {searchCounts.areas === 1 ? "area" : "areas"} match “
                {query.trim()}”
              </p>
            )}

            {coverage.divisions.length === 0 ? (
              <EmptyState
                icon={MapPinOff}
                title="No divisions yet"
                description="Add your first division to start defining where you deliver."
                action={
                  canEdit ? (
                    adding?.level === "division" ? (
                      <div className="w-full max-w-sm text-left">
                        <AddRow
                          value={addValue}
                          onChange={setAddValue}
                          onSubmit={addEntry}
                          onCancel={cancelAdding}
                          placeholder="Division name"
                        />
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => startAdding({ level: "division" })}
                      >
                        <Plus className="size-4" />
                        Add division
                      </Button>
                    )
                  ) : null
                }
              />
            ) : tree.length === 0 ? (
              <EmptyState
                icon={Search}
                title={`No matches for “${query.trim()}”`}
                description="Try a different division, city or area name."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSearchChange("")}
                  >
                    Clear search
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Divisions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totals.enabledDivisions}/{totals.divisions} selected
                  </p>
                </div>

                {tree.map(({ division, cities: cityNodes }) => {
                  const key = divisionKey(division.name);
                  const expanded = isNodeExpanded(key, "division");
                  const allCities = citiesByDivision.get(division.name) ?? [];
                  const enabledCityCount = allCities.filter(
                    (city) => city.enabled,
                  ).length;
                  const divisionAreaCount = allCities.reduce(
                    (sum, city) =>
                      sum + (areasByCity.get(city.name)?.length ?? 0),
                    0,
                  );
                  const enabledAreaCount = allCities.reduce(
                    (sum, city) =>
                      sum +
                      (areasByCity
                        .get(city.name)
                        ?.filter((area) => area.enabled).length ?? 0),
                    0,
                  );
                  const branchTotal = 1 + allCities.length + divisionAreaCount;
                  const branchEnabled =
                    (division.enabled ? 1 : 0) +
                    enabledCityCount +
                    enabledAreaCount;
                  const editingThis =
                    editing?.level === "division" &&
                    editing.name === division.name;

                  return (
                    <div
                      key={division.name}
                      className={cn(
                        "overflow-hidden rounded-2xl border bg-background transition-colors",
                        !division.enabled && "bg-muted/20",
                      )}
                    >
                      <div className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
                        <Checkbox
                          checked={checkboxState(branchEnabled, branchTotal)}
                          disabled={!canEdit}
                          aria-label={`Select all of ${division.name}`}
                          title={`Select all in ${division.name}`}
                          onCheckedChange={(value) =>
                            setDivisionBranch(division.name, value === true)
                          }
                          className="size-4.5"
                        />

                        <span
                          className={cn(
                            "hidden size-9 shrink-0 items-center justify-center rounded-lg border sm:flex",
                            division.enabled
                              ? "border-primaryColor/15 bg-primaryColor/10 text-primaryColor"
                              : "border-transparent bg-muted text-muted-foreground",
                          )}
                        >
                          <Landmark className="size-4" />
                        </span>

                        <div className="min-w-0 flex-1">
                          {editingThis ? (
                            <InlineEdit
                              value={editValue}
                              onChange={setEditValue}
                              onSubmit={commitRename}
                              onCancel={cancelEditing}
                              label={division.name}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleNode(key, "division")}
                              aria-expanded={expanded}
                              className="block w-full min-w-0 text-left"
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "truncate text-sm font-semibold sm:text-[15px]",
                                    !division.enabled &&
                                      "text-muted-foreground",
                                  )}
                                >
                                  {division.name}
                                </span>
                                {!division.enabled && (
                                  <Badge
                                    variant="outline"
                                    className="px-1.5 py-0 text-[10px] text-muted-foreground"
                                  >
                                    Off
                                  </Badge>
                                )}
                              </span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground sm:text-xs">
                                <span>
                                  {enabledCityCount}/{allCities.length} cities
                                </span>
                                <span className="size-0.5 rounded-full bg-muted-foreground/40" />
                                <span>
                                  {enabledAreaCount}/{divisionAreaCount} areas
                                </span>
                              </span>
                            </button>
                          )}
                        </div>

                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 text-muted-foreground"
                                aria-label={`Actions for ${division.name}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() =>
                                  startEditing({
                                    level: "division",
                                    name: division.name,
                                  })
                                }
                              >
                                <Pencil className="size-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setPendingDelete({
                                    level: "division",
                                    name: division.name,
                                  })
                                }
                              >
                                <Trash2 className="size-4" />
                                Delete division
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleNode(key, "division")}
                          aria-expanded={expanded}
                          aria-label={`${
                            expanded ? "Collapse" : "Expand"
                          } ${division.name}`}
                          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform",
                              expanded && "rotate-180",
                            )}
                          />
                        </button>
                      </div>

                      {expanded && (
                        <div className="border-t bg-muted/20 p-2.5 sm:p-3">
                          {!division.enabled && (
                            <p className="mb-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                              <PowerOff className="size-3.5 shrink-0" />
                              This division is off — its cities will not appear
                              at checkout.
                            </p>
                          )}

                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Cities
                            </p>
                            {allCities.length > 0 && (
                              <label
                                className={cn(
                                  "flex cursor-pointer select-none items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[11px] shadow-xs transition-colors hover:bg-muted/60",
                                  !canEdit && "cursor-not-allowed opacity-60",
                                )}
                                title={`Mark or unmark every city in ${division.name}`}
                              >
                                <Checkbox
                                  checked={checkboxState(
                                    enabledCityCount + enabledAreaCount,
                                    allCities.length + divisionAreaCount,
                                  )}
                                  disabled={!canEdit}
                                  aria-label={`Select all cities in ${division.name}`}
                                  onCheckedChange={(value) =>
                                    setDivisionCities(
                                      division.name,
                                      value === true,
                                    )
                                  }
                                  className="size-3.5 rounded-[3px]"
                                />
                                <span className="font-medium">
                                  Select all cities
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                  {enabledCityCount}/{allCities.length}
                                </span>
                              </label>
                            )}
                          </div>

                          <div className="grid items-start gap-2 md:grid-cols-2 2xl:grid-cols-3">
                            {cityNodes.length === 0 && (
                              <p className="col-span-full rounded-xl border border-dashed px-3 py-3 text-xs text-muted-foreground">
                                No cities in this division yet.
                              </p>
                            )}

                            {cityNodes.map(({ city, areas }) => {
                              const key = cityKey(division.name, city.name);
                              const cityExpanded = isNodeExpanded(key, "city");
                              const allCityAreas =
                                areasByCity.get(city.name) ?? [];
                              const enabledCityAreas = allCityAreas.filter(
                                (area) => area.enabled,
                              ).length;
                              const cityBranchTotal = 1 + allCityAreas.length;
                              const cityBranchEnabled =
                                (city.enabled ? 1 : 0) + enabledCityAreas;
                              const editingThis =
                                editing?.level === "city" &&
                                editing.name === city.name &&
                                editing.division === division.name;

                              return (
                                <div
                                  key={`${city.division}-${city.name}`}
                                  className={cn(
                                    "overflow-hidden rounded-xl border bg-background transition-colors",
                                    !city.enabled && "bg-muted/30",
                                  )}
                                >
                                  <div className="flex items-center gap-2 p-2">
                                    <Checkbox
                                      checked={checkboxState(
                                        cityBranchEnabled,
                                        cityBranchTotal,
                                      )}
                                      disabled={!canEdit}
                                      aria-label={`Select all of ${city.name}`}
                                      title={`Select all in ${city.name}`}
                                      onCheckedChange={(value) =>
                                        setCityBranch(city.name, value === true)
                                      }
                                      className="size-4.5"
                                    />

                                    <span
                                      className={cn(
                                        "hidden size-7 shrink-0 items-center justify-center rounded-md sm:flex",
                                        city.enabled
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      <Building2 className="size-3.5" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                      {editingThis ? (
                                        <InlineEdit
                                          value={editValue}
                                          onChange={setEditValue}
                                          onSubmit={commitRename}
                                          onCancel={cancelEditing}
                                          label={city.name}
                                        />
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleNode(key, "city")
                                          }
                                          aria-expanded={cityExpanded}
                                          className="block w-full min-w-0 text-left"
                                        >
                                          <span
                                            className={cn(
                                              "block truncate text-sm font-medium",
                                              !city.enabled &&
                                                "text-muted-foreground",
                                            )}
                                          >
                                            {city.name}
                                          </span>
                                          <span className="text-[11px] text-muted-foreground">
                                            {enabledCityAreas}/
                                            {allCityAreas.length} areas
                                          </span>
                                        </button>
                                      )}
                                    </div>

                                    {canEdit && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="shrink-0 text-muted-foreground"
                                            aria-label={`Actions for ${city.name}`}
                                          >
                                            <MoreHorizontal className="size-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="end"
                                          className="w-48"
                                        >
                                          <DropdownMenuItem
                                            onClick={() =>
                                              startEditing({
                                                level: "city",
                                                name: city.name,
                                                division: division.name,
                                              })
                                            }
                                          >
                                            <Pencil className="size-4" />
                                            Rename
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() =>
                                              setPendingDelete({
                                                level: "city",
                                                name: city.name,
                                                division: division.name,
                                              })
                                            }
                                          >
                                            <Trash2 className="size-4" />
                                            Delete city
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => toggleNode(key, "city")}
                                      aria-expanded={cityExpanded}
                                      aria-label={`${
                                        cityExpanded ? "Collapse" : "Expand"
                                      } ${city.name}`}
                                      className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                      <ChevronDown
                                        className={cn(
                                          "size-3.5 transition-transform",
                                          cityExpanded && "rotate-180",
                                        )}
                                      />
                                    </button>
                                  </div>

                                  {cityExpanded && (
                                    <div className="space-y-2 border-t bg-muted/20 p-2">
                                      {allCityAreas.length > 0 && (
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Areas
                                          </p>
                                          <label
                                            className={cn(
                                              "flex cursor-pointer select-none items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[11px] shadow-xs transition-colors hover:bg-muted/60",
                                              !canEdit &&
                                                "cursor-not-allowed opacity-60",
                                            )}
                                            title={`Mark or unmark every area in ${city.name}`}
                                          >
                                            <Checkbox
                                              checked={checkboxState(
                                                enabledCityAreas,
                                                allCityAreas.length,
                                              )}
                                              disabled={!canEdit}
                                              aria-label={`Select all areas in ${city.name}`}
                                              onCheckedChange={(value) =>
                                                setCityAreas(
                                                  city.name,
                                                  value === true,
                                                )
                                              }
                                              className="size-3.5 rounded-[3px]"
                                            />
                                            <span className="font-medium">
                                              Select all areas
                                            </span>
                                            <span className="tabular-nums text-muted-foreground">
                                              {enabledCityAreas}/
                                              {allCityAreas.length}
                                            </span>
                                          </label>
                                        </div>
                                      )}

                                      {areas.length === 0 ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-dashed bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                                          <MapPinOff className="size-3.5 shrink-0" />
                                          {isSearching
                                            ? "No matching areas."
                                            : "No areas yet — add the first one below."}
                                        </div>
                                      ) : (
                                        <div className="grid gap-1.5 sm:grid-cols-2">
                                          {areas.map((area) => (
                                            <AreaTile
                                              key={`${area.city}-${area.name}`}
                                              id={domId(
                                                "area",
                                                division.name,
                                                city.name,
                                                area.name,
                                              )}
                                              area={area}
                                              canEdit={canEdit}
                                              onToggle={() =>
                                                toggleArea(area.city, area.name)
                                              }
                                              onDelete={() =>
                                                setPendingDelete({
                                                  level: "area",
                                                  name: area.name,
                                                  city: area.city,
                                                })
                                              }
                                            />
                                          ))}
                                        </div>
                                      )}

                                      {!isSearching && canEdit && (
                                        <div className="pt-0.5">
                                          {adding?.level === "area" &&
                                          adding.city === city.name ? (
                                            <AddRow
                                              value={addValue}
                                              onChange={setAddValue}
                                              onSubmit={addEntry}
                                              onCancel={cancelAdding}
                                              placeholder={`Area name in ${city.name}`}
                                              hint="Tip: separate multiple areas with commas."
                                            />
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                startAdding({
                                                  level: "area",
                                                  city: city.name,
                                                })
                                              }
                                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                            >
                                              <Plus className="size-3.5" />
                                              Add area
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {!isSearching && canEdit && (
                              <div className="min-h-16">
                                {adding?.level === "city" &&
                                adding.division === division.name ? (
                                  <AddRow
                                    value={addValue}
                                    onChange={setAddValue}
                                    onSubmit={addEntry}
                                    onCancel={cancelAdding}
                                    placeholder={`City name in ${division.name}`}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startAdding({
                                        level: "city",
                                        division: division.name,
                                      })
                                    }
                                    className="flex h-full min-h-16 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primaryColor/30 hover:bg-primaryColor/5 hover:text-foreground"
                                  >
                                    <Plus className="size-3.5" />
                                    Add city to {division.name}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isSearching && canEdit && (
                  <div className="pt-1">
                    {adding?.level === "division" ? (
                      <AddRow
                        value={addValue}
                        onChange={setAddValue}
                        onSubmit={addEntry}
                        onCancel={cancelAdding}
                        placeholder="Division name"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startAdding({ level: "division" })}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primaryColor/30 hover:bg-primaryColor/5 hover:text-foreground"
                      >
                        <Plus className="size-3.5" />
                        Add division
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isDirty && canEdit && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border bg-background/95 p-2.5 pl-4 shadow-xl backdrop-blur supports-backdrop-filter:bg-background/80"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
            <span className="truncate font-medium">Unsaved changes</span>
            <span className="hidden text-muted-foreground sm:inline">
              — review and save to publish
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingDelete) && Boolean(deleteCopy)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="size-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Small presentational pieces -----------------------------------------

/** One area rendered as a selectable grid card. */
function AreaTile({
  id,
  area,
  canEdit,
  onToggle,
  onDelete,
}: {
  id: string;
  area: CoverageArea;
  canEdit: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group/area flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
        area.enabled
          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-border bg-background hover:bg-muted/40",
      )}
    >
      <Checkbox
        id={id}
        checked={area.enabled}
        disabled={!canEdit}
        onCheckedChange={onToggle}
        className="size-3.5 rounded-[3px]"
      />
      <label
        htmlFor={id}
        className={cn(
          "min-w-0 flex-1 truncate text-xs",
          canEdit ? "cursor-pointer" : "cursor-default",
          area.enabled
            ? "font-medium text-emerald-900 dark:text-emerald-100"
            : "text-muted-foreground",
        )}
        title={area.name}
      >
        {area.name}
      </label>
      {canEdit && (
        <button
          type="button"
          aria-label={`Delete ${area.name}`}
          title="Delete area"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground transition-opacity hover:bg-red-100 hover:text-red-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover/area:opacity-100 dark:hover:bg-red-950/50"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function AddRow({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-lg border bg-background p-2 shadow-xs"
    >
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onCancel();
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 shrink-0 px-2.5"
          disabled={!value.trim()}
        >
          <Check className="size-3.5" />
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCancel}
          aria-label="Cancel"
          className="shrink-0"
        >
          <X className="size-4" />
        </Button>
      </div>
      {hint && (
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </form>
  );
}

function InlineEdit({
  value,
  onChange,
  onSubmit,
  onCancel,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  label: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex items-center gap-1"
    >
      <Input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        aria-label={`Rename ${label}`}
        className="h-8 text-sm"
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        aria-label="Save name"
      >
        <Check className="size-4 text-emerald-600" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={onCancel}
        aria-label="Cancel rename"
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}
