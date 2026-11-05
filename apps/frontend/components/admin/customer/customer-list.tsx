"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ListPaginationFooter } from "@/components/common/list-pagination-footer";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  getEnabledAreas,
  getEnabledCities,
  getEnabledDivisions,
} from "@/lib/delivery-coverage";
import { cn, formatDateTime } from "@/lib/utils";
import {
  fetchDataPagination,
  fetchProtectedData,
} from "@/utils/api-utils";
import type { ApiResponseusers, User } from "@/utils/types";
import {
  BadgeCheck,
  BadgeX,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MoreHorizontal,
  Pencil,
  SlidersHorizontal,
  UserCircle,
  User as UserIcon,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface CustomerListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

/** Area of the customer's default (or first) saved address. */
const areaOf = (customer: User) => {
  const list = customer.addresses ?? [];
  return (list.find((a) => a.isDefault) ?? list[0])?.area || null;
};

export function CustomerList({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: CustomerListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/customer/customer-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [customers, setCustomers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  // Address-location filters — options from the live coverage tree.
  const settings = useBusinessSettings();
  const coverage = settings?.deliveryCoverage ?? null;
  const [filters, setFilters] = useState({
    divisionFilter: (getInitialParam("division") as string) || "",
    cityFilter: (getInitialParam("city") as string) || "",
    areaFilter: (getInitialParam("area") as string) || "",
  });
  const { divisionFilter, cityFilter, areaFilter } = filters;
  const [isLoading, setIsLoading] = useState(true);
  // Below `md` the location filters collapse into a bottom sheet.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (divisionFilter) params.set("division", divisionFilter);
    if (cityFilter) params.set("city", cityFilter);
    if (areaFilter) params.set("area", areaFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    searchQuery,
    divisionFilter,
    cityFilter,
    areaFilter,
  ]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (divisionFilter) params.append("division", divisionFilter);
      if (cityFilter) params.append("city", cityFilter);
      if (areaFilter) params.append("area", areaFilter);

      const response = await fetchDataPagination<ApiResponseusers>(
        `users/customers?${params.toString()}`
      );

      setCustomers(response.data.customers);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers. Please try again.");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, divisionFilter, cityFilter, areaFilter]);

  // Area-wise customer counts ("Gulshan — 25 customers"), shown in a
  // collapsible panel; tapping a chip filters the list to that area.
  const [areaStats, setAreaStats] = useState<
    { area: string; customers: number }[]
  >([]);
  const [areaPanelOpen, setAreaPanelOpen] = useState(false);

  useEffect(() => {
    fetchProtectedData<{ area: string; customers: number }[]>(
      "users/customers/area-stats"
    )
      .then(setAreaStats)
      .catch((error: unknown) =>
        console.error("Error loading area stats:", error)
      );
  }, []);

  // Initial load with URL params
  useEffect(() => {
    const pageFromUrl = searchParams?.get("page");
    const searchFromUrl = searchParams?.get("search");

    if (pageFromUrl) {
      setCurrentPage(parseInt(pageFromUrl, 10));
    }
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilters({ divisionFilter: "", cityFilter: "", areaFilter: "" });
    setCurrentPage(1);
  };

  const verifiedCount = customers.filter((c) => c.isVerified).length;
  const unverifiedCount = customers.length - verifiedCount;

  const activeFilterCount = [
    Boolean(divisionFilter),
    Boolean(cityFilter),
    Boolean(areaFilter),
  ].filter(Boolean).length;

  // One source of truth for the location filters: the toolbar renders them
  // inline ("bar") at md+, the mobile sheet renders the same nodes full width
  // ("sheet") under a visible label.
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const triggerClass =
      mode === "bar" ? "h-9 w-full" : "h-11 w-full px-3 text-sm font-medium";

    const dims = [
      { key: "divisionFilter", label: "Division", barClass: "md:w-40" },
      { key: "cityFilter", label: "City", barClass: "md:w-40" },
      { key: "areaFilter", label: "Area", barClass: "md:w-40" },
    ] as const;

    return dims.map(({ key, label, barClass }) => {
      const options =
        key === "divisionFilter"
          ? getEnabledDivisions(coverage)
          : key === "cityFilter"
            ? getEnabledCities(coverage, divisionFilter)
            : getEnabledAreas(coverage, cityFilter);
      return {
        key,
        label,
        barClass,
        node: (
          <SearchableSelect
            value={filters[key]}
            onValueChange={(value) => {
              if (value !== filters[key]) {
                // Clear children when a parent changes.
                if (key === "divisionFilter")
                  setFilters({ divisionFilter: value, cityFilter: "", areaFilter: "" });
                else if (key === "cityFilter")
                  setFilters({ ...filters, cityFilter: value, areaFilter: "" });
                else setFilters({ ...filters, areaFilter: value });
              }
              setCurrentPage(1);
            }}
            options={options}
            placeholder={label}
            searchPlaceholder={`Search ${label.toLowerCase()}...`}
            disabled={key !== "divisionFilter" && (key === "cityFilter" ? !divisionFilter : !cityFilter)}
            className={triggerClass}
          />
        ),
      };
    });
  };

  const renderActions = (customer: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/customer/${customer.id}/view`}>
            <UserCircle className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/customer/${customer.id}/edit?page=${currentPage}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full">
      <PageHeader
        title="Customers"
        description="Registered customer accounts with their contact details and activity."
      >
      </PageHeader>

      {/* Toolbar */}
      <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap md:gap-3">
          <TableSearch
            wrapperClassName="min-w-0 flex-1 md:max-w-xs md:flex-none"
            className="h-9"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
          />

          {/* Mobile: location filters collapse into a bottom sheet */}
          <div className="shrink-0 md:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="size-4.5 rounded-full px-0 text-[0.65rem] font-semibold">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="inset-x-3 max-h-[82dvh] gap-0 overflow-y-auto rounded-2xl"
              >
                <SheetHeader className="border-b pr-14">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow customers by division, city and area.
                  </SheetDescription>
                </SheetHeader>

                {renderFilterControls("sheet").map((control) => (
                  <div key={control.key} className="px-4 pt-4">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {control.label}
                    </p>
                    {control.node}
                  </div>
                ))}

                <SheetFooter className="sticky bottom-0 mt-4 flex-row border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      clearAllFilters();
                      setFilterSheetOpen(false);
                    }}
                  >
                    Clear all
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">
                      {totalItems > 0
                        ? `Show ${totalItems.toLocaleString("en-US")} customers`
                        : "Done"}
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: location filters inline — options from the live coverage tree */}
          <div className="hidden items-center gap-3 md:flex">
            {renderFilterControls("bar").map((control) => (
              <div key={control.key} className={control.barClass}>
                {control.node}
              </div>
            ))}
          </div>
          {(searchQuery || divisionFilter || cityFilter || areaFilter) && (
            <div className="flex flex-wrap items-center gap-2 md:ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={clearAllFilters}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Customers by area — collapsible chips; tap to filter the list */}
      <div className="mb-6 rounded-xl border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => setAreaPanelOpen((o) => !o)}
          aria-expanded={areaPanelOpen}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            Customers by area
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {areaStats.length} areas
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              areaPanelOpen && "rotate-180"
            )}
          />
        </button>
        {areaPanelOpen && (
          <div className="border-t p-3">
            <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto">
              {areaStats.map((s) => (
                <button
                  key={s.area}
                  type="button"
                  onClick={() => {
                    setFilters({
                      divisionFilter: "",
                      cityFilter: "",
                      areaFilter: s.area,
                    });
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-colors",
                    areaFilter === s.area
                      ? "border-primaryColor bg-primaryColor text-white"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {s.area}{" "}
                  <span className="text-muted-foreground">· {s.customers}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingIndicator message="Loading customers..." />
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <UserCircle className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No customers found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery || divisionFilter || cityFilter || areaFilter
                ? "No customers match your search or filters."
                : "No customers have been registered yet."}
            </p>
          </div>
          {(searchQuery || divisionFilter || cityFilter || areaFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatsCard
              icon={Users}
              title="Total customers"
              value={totalItems.toLocaleString("en-US")}
              description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
              bgColor="blue"
            />
            <StatsCard
              icon={CheckCircle2}
              title="Verified"
              value={verifiedCount.toLocaleString("en-US")}
              description="On this page"
              bgColor="green"
            />
            <StatsCard
              icon={BadgeX}
              title="Unverified"
              value={unverifiedCount.toLocaleString("en-US")}
              description="On this page"
              bgColor="orange"
            />
            <StatsCard
              icon={UserCircle}
              title="Showing"
              value={customers.length.toLocaleString("en-US")}
              description={`Of ${totalItems.toLocaleString("en-US")} customers`}
              bgColor="purple"
            />
          </div>

          {/* Customers */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Customers</h3>
                <p className="text-xs text-muted-foreground">
                  Newest first · {limit} per page
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {totalItems.toLocaleString("en-US")} total
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const area = areaOf(customer);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="py-2.5 pl-4">
                          <Link
                            href={`/admin/customer/${customer.id}/view`}
                            className="flex items-center gap-3 font-medium leading-tight hover:text-primaryColor hover:underline"
                          >
                            {customer.profilePhoto?.url ? (
                              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted">
                                <Image
                                  src={customer.profilePhoto.url}
                                  alt={customer.name || "Customer"}
                                  fill
                                  className="object-contain"
                                />
                              </span>
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                                {customer.name?.charAt(0) || (
                                  <UserIcon className="h-5 w-5" />
                                )}
                              </span>
                            )}
                            <span className="truncate">{customer.name}</span>
                          </Link>
                        </TableCell>

                        <TableCell>
                          <span className="block max-w-55 truncate text-muted-foreground">
                            {customer.email}
                          </span>
                        </TableCell>

                        <TableCell>
                          {customer.mobileNumber ? (
                            <a
                              href={`tel:${customer.mobileNumber}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {customer.mobileNumber}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {area ? (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {area}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={customer.isVerified ? "emerald" : "neutral"}
                            className="gap-1"
                          >
                            {customer.isVerified ? (
                              <BadgeCheck className="h-3 w-3" />
                            ) : (
                              <BadgeX className="h-3 w-3" />
                            )}
                            {customer.isVerified ? "Verified" : "Unverified"}
                          </PillBadge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {formatDateTime(customer.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.lastLoginAt
                            ? formatDateTime(customer.lastLoginAt)
                            : "Never"}
                        </TableCell>

                        <TableCell className="pr-4 text-right">
                          {renderActions(customer)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {customers.map((customer) => {
                const area = areaOf(customer);
                return (
                  <article key={customer.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/customer/${customer.id}/view`}
                        className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                      >
                        {customer.profilePhoto?.url ? (
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border bg-muted">
                            <Image
                              src={customer.profilePhoto.url}
                              alt={customer.name || "Customer"}
                              fill
                              className="object-contain"
                            />
                          </span>
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                            {customer.name?.charAt(0) || (
                              <UserIcon className="h-5 w-5" />
                            )}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {customer.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <PillBadge
                          tone={customer.isVerified ? "emerald" : "neutral"}
                        >
                          {customer.isVerified ? "Verified" : "Unverified"}
                        </PillBadge>
                        {renderActions(customer)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Mobile
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {customer.mobileNumber || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Area
                        </p>
                        <p className="truncate text-sm font-semibold">
                          {area || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Joined
                        </p>
                        <p className="text-sm">
                          {formatDateTime(customer.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Last Login
                        </p>
                        <p className="text-sm">
                          {customer.lastLoginAt
                            ? formatDateTime(customer.lastLoginAt)
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Footer: what the list covers */}
            <ListPaginationFooter
              currentPage={currentPage}
              limit={limit}
              totalItems={totalItems}
              totalPages={totalPages}
              entityLabel="customer"
              onPageChange={handlePageChange}
              searchQuery={searchQuery}
            />
          </div>
        </>
      )}
    </div>
  );
}
