"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge, type PillTone } from "@/components/common/pill-badge";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { ApiResponseusers, User } from "@/utils/types";
import {
  BadgeCheck,
  BadgeX,
  Briefcase,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Store,
  Trash2,
  UserCircle,
  User as UserIcon,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

// Role badge icons — keyed by rolename with a generic fallback.
const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-3 w-3" />,
  superadmin: <Shield className="h-3 w-3" />,
  modaretor: <Shield className="h-3 w-3" />,
  manager: <Briefcase className="h-3 w-3" />,
  storemanager: <Store className="h-3 w-3" />,
  staff: <Users className="h-3 w-3" />,
  customer: <UserIcon className="h-3 w-3" />,
};

const ROLE_TONE: Record<string, PillTone> = {
  superadmin: "violet",
  admin: "violet",
  modaretor: "sky",
  manager: "blue",
  storemanager: "blue",
  staff: "neutral",
  customer: "emerald",
};

const roleKey = (roleName: string | undefined) =>
  (roleName ?? "").trim().toLowerCase();

const getRoleIcon = (roleName: string | undefined) =>
  roleIcons[roleKey(roleName)] ?? <UserCircle className="h-3 w-3" />;

const getRoleTone = (roleName: string | undefined): PillTone =>
  ROLE_TONE[roleKey(roleName)] ?? "neutral";

interface UserListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function UserList({
  initialPage = 1,
  initialLimit = 30,
  initialSearchParams = {},
}: UserListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/user";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [roleFilter, setRoleFilter] = useState(
    getInitialParam("role") as string
  );
  const [isLoading, setIsLoading] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);

      const response = await fetchDataPagination<ApiResponseusers>(
        `users/users?${params.toString()}`
      );

      setUsers(response.data.users);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users. Please try again.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, roleFilter]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteData("users", selectedUser.id);
      fetchUsers();
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasFilters = Boolean(searchQuery || (roleFilter && roleFilter !== "all"));
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const unverifiedCount = users.length - verifiedCount;
  const adminCount = users.filter((u) => u.isAdmin).length;
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (user: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/user/${user?.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(user)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Users"
          description="Every account in the system, with its role, verification and last sign-in."
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/user/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add User</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchUsers}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <TableSearch
              wrapperClassName="w-full md:max-w-xs"
              className="h-9"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="w-full md:w-40 md:shrink-0">
              <Select
                value={roleFilter || "all"}
                onValueChange={(value) => {
                  setRoleFilter(value === "all" ? "" : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[searchQuery && `Search: ${searchQuery}`, roleFilter && roleFilter !== "all" && `Role: ${roleFilter}`]
                    .filter(Boolean)
                    .join(" · ")}
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
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
            <LoadingIndicator message="Loading users..." />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <UserCircle className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No users found</p>
              <p className="text-xs text-muted-foreground">
                {hasFilters
                  ? "No users match these filters. Try different search terms."
                  : "Get started by adding your first user."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              can(MENU_URL, "canCreate") && (
                <Button size="sm" asChild>
                  <Link href="/admin/user/add">
                    <Plus className="size-4" /> Add User
                  </Link>
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <StatsCard
                icon={Users}
                title="Total users"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={ShieldCheck}
                title="Admins"
                value={adminCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="purple"
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
            </div>

            {/* Users */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Users</h3>
                  <p className="text-xs text-muted-foreground">
                    All accounts · {limit} per page
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
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="py-2.5 pl-4">
                          <Link
                            href={`/admin/user/${user?.id}/edit`}
                            className="flex items-center gap-3 font-medium leading-tight hover:text-primaryColor hover:underline"
                          >
                            {user.profilePhoto?.url ? (
                              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted">
                                <Image
                                  src={user.profilePhoto.url}
                                  alt={user.name || "User"}
                                  fill
                                  className="object-contain"
                                />
                              </span>
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                                {user.name?.charAt(0) || (
                                  <UserIcon className="h-5 w-5" />
                                )}
                              </span>
                            )}
                            <span className="truncate">{user.name}</span>
                          </Link>
                        </TableCell>

                        <TableCell>
                          <span className="block max-w-55 truncate text-muted-foreground">
                            {user.email}
                          </span>
                        </TableCell>

                        <TableCell>
                          {user.mobileNumber ? (
                            <a
                              href={`tel:${user.mobileNumber}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {user.mobileNumber}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={user.isVerified ? "emerald" : "neutral"}
                            className="gap-1"
                          >
                            {user.isVerified ? (
                              <BadgeCheck className="h-3 w-3" />
                            ) : (
                              <BadgeX className="h-3 w-3" />
                            )}
                            {user.isVerified ? "Verified" : "Unverified"}
                          </PillBadge>
                        </TableCell>

                        <TableCell>
                          <PillBadge
                            tone={getRoleTone(user?.role?.rolename)}
                            className="gap-1 capitalize"
                          >
                            {getRoleIcon(user?.role?.rolename)}
                            {user?.role?.rolename ?? "—"}
                          </PillBadge>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {user.lastLoginAt
                            ? formatDateTime(user.lastLoginAt)
                            : "Never"}
                        </TableCell>

                        <TableCell className="pr-4 text-right">
                          {renderActions(user)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {users.map((user) => (
                  <article key={user.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/user/${user?.id}/edit`}
                        className="flex min-w-0 items-center gap-2.5 hover:text-primaryColor"
                      >
                        {user.profilePhoto?.url ? (
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border bg-muted">
                            <Image
                              src={user.profilePhoto.url}
                              alt={user.name || "User"}
                              fill
                              className="object-contain"
                            />
                          </span>
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
                            {user.name?.charAt(0) || (
                              <UserIcon className="h-5 w-5" />
                            )}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {user.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <PillBadge tone={getRoleTone(user?.role?.rolename)}>
                          {user?.role?.rolename ?? "—"}
                        </PillBadge>
                        {renderActions(user)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Mobile
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {user.mobileNumber || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Status
                        </p>
                        <p className="text-sm font-semibold">
                          {user.isVerified ? "Verified" : "Unverified"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Last Login
                        </p>
                        <p className="text-sm">
                          {user.lastLoginAt
                            ? formatDateTime(user.lastLoginAt)
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer: what the list covers */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} user
                  {totalItems === 1 ? "" : "s"}
                  {searchQuery && ` matching “${searchQuery}”`}
                </p>
                {totalPages > 1 && (
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    baseUrl="#"
                    onPageChange={handlePageChange}
                  />
                )}
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
        defaultToast={false}
      />
    </>
  );
}
