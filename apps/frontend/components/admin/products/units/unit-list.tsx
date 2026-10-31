"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { deleteData, fetchData } from "@/utils/api-utils";
import type { Unit } from "@/utils/types";
import {
  CalendarClock,
  CalendarPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../../delete-confirmation-dialog";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

/** "08 May 2025, 01:10 pm" → date and time on separate lines. */
function splitDateTime(value?: string) {
  const formatted = formatDateTime(value ?? "");
  const splitAt = formatted.lastIndexOf(", ");
  if (splitAt === -1) return { date: formatted, time: "—" };
  return {
    date: formatted.slice(0, splitAt),
    time: formatted.slice(splitAt + 2),
  };
}

const toTime = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

/** Label + value block reused by the mobile cards. */
function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-foreground/60">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export function UnitList() {
  const MENU_URL = "/admin/products/units";
  const { can } = usePermissions();
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const response = (await fetchData("units")) as Unit[];
      setUnits(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to load units. Please try again.");
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleDeleteClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;

    const deletedId = selectedUnit.id;

    try {
      await deleteData("units", deletedId);
      // The API soft-deletes: drop the row right away, then re-sync the list.
      setUnits((prev) => prev.filter((unit) => unit.id !== deletedId));
      toast.success("Unit deleted successfully");
      fetchUnits();
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error("Failed to delete unit. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const canEdit = can(MENU_URL, "canEdit");
  const canDelete = can(MENU_URL, "canDelete");
  const hasRowActions = canEdit || canDelete;

  const renderActions = (unit: Unit) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/units/${unit.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDeleteClick(unit)}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /** Two-line date + time, shared by both timestamp columns. */
  const renderTimestamp = (value?: string) => {
    const { date, time } = splitDateTime(value);
    return (
      <div className="min-w-0">
        <p className="truncate text-sm" title={formatDateTime(value ?? "")}>
          {date}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-foreground/70">{time}</p>
      </div>
    );
  };

  // The units endpoint returns the full (small) list, so searching and
  // counting happen on the client instead of round-tripping to the API.
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUnits = normalizedQuery
    ? units.filter((unit) => unit.name.toLowerCase().includes(normalizedQuery))
    : units;
  const hasActiveFilters = Boolean(normalizedQuery);

  const clearFilters = () => setSearchQuery("");

  const newestUnit = units.reduce<Unit | null>(
    (latest, unit) =>
      !latest || toTime(unit.createdAt) > toTime(latest.createdAt) ? unit : latest,
    null
  );
  const lastEditedUnit = units.reduce<Unit | null>(
    (latest, unit) =>
      !latest || toTime(unit.updatedAt) > toTime(latest.updatedAt) ? unit : latest,
    null
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Units"
          description="Measurement units offered when a product is priced and stocked."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchUnits}
          >
            <RefreshCw
              className={isLoading ? "size-3.5 animate-spin" : "size-3.5"}
            />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" asChild>
              <Link href="/admin/products/units/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Unit</span>
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <TableSearch
              wrapperClassName="w-full md:max-w-xs"
              className="h-9"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            {hasActiveFilters && (
              <div className="flex min-w-0 items-center gap-2 md:ml-auto">
                <PillBadge
                  className="font-medium"
                  title={`Search: ${searchQuery.trim()}`}
                >
                  <span className="truncate">Search: {searchQuery.trim()}</span>
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0 text-muted-foreground"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingIndicator message="Loading units..." />
          </div>
        ) : units.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Scale className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No units found</p>
              <p className="text-xs text-muted-foreground">
                Add your first unit so products can be priced by weight, piece
                or volume.
              </p>
            </div>
            {can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/products/units/add">
                  <Plus className="size-4" /> Add unit
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* List totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={Scale}
                title="Total units"
                value={units.length.toLocaleString("en-US")}
                description="Selectable on every product"
                bgColor="blue"
              />
              <StatsCard
                icon={CalendarPlus}
                title="Newest"
                value={newestUnit?.name ?? "—"}
                description={
                  newestUnit
                    ? `Added ${splitDateTime(newestUnit.createdAt).date}`
                    : "No units yet"
                }
                bgColor="green"
              />
              <StatsCard
                icon={CalendarClock}
                title="Last edited"
                value={lastEditedUnit?.name ?? "—"}
                description={
                  lastEditedUnit
                    ? `Edited ${splitDateTime(lastEditedUnit.updatedAt).date}`
                    : "No units yet"
                }
                bgColor="amber"
              />
            </div>

            {/* Units */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/15 dark:text-sky-400">
                    <Scale className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">All units</h3>
                    <p className="text-[13px] text-foreground/70">
                      Only active units are listed. Deleting one deactivates it
                      and drops it from the product form.
                    </p>
                  </div>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {filteredUnits.length.toLocaleString("en-US")} of{" "}
                  {units.length.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table table-fixed">
                  <TableHeader className="[&_th]:font-semibold">
                    <TableRow className="hover:bg-transparent">
                      {/* Unit is pinned so the name column no longer eats the
                          row; the timestamps share whatever is left. */}
                      <TableHead className="w-52 pl-4">Unit</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last updated</TableHead>
                      <TableHead className="w-14 pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="py-2.5 pl-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-foreground/70">
                              <Scale className="size-4" />
                            </span>
                            <p
                              className="truncate text-sm font-medium capitalize"
                              title={unit.name}
                            >
                              {unit.name}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {renderTimestamp(unit.createdAt)}
                        </TableCell>

                        <TableCell>
                          {renderTimestamp(unit.updatedAt)}
                        </TableCell>

                        <TableCell className="pr-4 text-right">
                          {hasRowActions && renderActions(unit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {filteredUnits.map((unit) => (
                  <article key={unit.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-foreground/70">
                          <Scale className="size-4" />
                        </span>
                        <p className="truncate text-sm font-semibold capitalize">
                          {unit.name}
                        </p>
                      </div>
                      {hasRowActions && renderActions(unit)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-2.5">
                      <DetailField label="Created">
                        <p className="text-[13px] text-foreground/80">
                          {splitDateTime(unit.createdAt).date}
                        </p>
                      </DetailField>
                      <DetailField label="Last updated">
                        <p className="text-[13px] text-foreground/80">
                          {splitDateTime(unit.updatedAt).date}
                        </p>
                      </DetailField>
                      <DetailField label="Created by">
                        <p className="truncate text-[13px] text-foreground/80">
                          {unit.createdBy?.name || "—"}
                        </p>
                      </DetailField>
                      <DetailField label="Updated by">
                        <p className="truncate text-[13px] text-foreground/80">
                          {unit.updatedBy?.name || "—"}
                        </p>
                      </DetailField>
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-[13px] text-foreground/70">
                  Showing {filteredUnits.length.toLocaleString("en-US")} of{" "}
                  {units.length.toLocaleString("en-US")} unit
                  {units.length === 1 ? "" : "s"}
                  {normalizedQuery && ` matching “${searchQuery.trim()}”`}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={selectedUnit ? `Delete “${selectedUnit.name}”?` : undefined}
        description="The unit is deactivated and is no longer offered on products. Products already using it stop showing a unit label on the storefront."
      />
    </>
  );
}
