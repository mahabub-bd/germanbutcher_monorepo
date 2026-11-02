"use client";

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
import { formatDateTime } from "@/lib/utils";
import { deleteData, fetchProtectedData } from "@/utils/api-utils";
import type { Role } from "@/utils/types";
import {
  Briefcase,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Store,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

// Role icon mapping — same keys as the user list's role badges.
const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="size-5 text-muted-foreground" />,
  superadmin: <Shield className="size-5 text-muted-foreground" />,
  modaretor: <Shield className="size-5 text-muted-foreground" />,
  manager: <Briefcase className="size-5 text-muted-foreground" />,
  storemanager: <Store className="size-5 text-muted-foreground" />,
  staff: <Users className="size-5 text-muted-foreground" />,
  customer: <User className="size-5 text-muted-foreground" />,
};

const getRoleIcon = (roleName: string | undefined) =>
  (roleName && roleIcons[roleName.trim().toLowerCase()]) || (
    <Shield className="size-5 text-muted-foreground" />
  );

export function RoleList() {
  const MENU_URL = "/admin/user/role/role-list";
  const { can } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = (await fetchProtectedData("roles")) as Role[];
      setRoles(response);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles. Please try again.");
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    try {
      await deleteData("roles", selectedRole.id);
      fetchRoles();
      toast.success("Role deleted successfully");
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  // The endpoint returns the full list, so filtering runs over loaded rows.
  const query = searchQuery.trim().toLowerCase();
  const visibleRoles = useMemo(
    () =>
      roles.filter((role) => {
        if (statusFilter === "active" && !role.isActive) return false;
        if (statusFilter === "inactive" && role.isActive) return false;
        if (!query) return true;
        return (
          role.rolename?.toLowerCase().includes(query) ||
          role.description?.toLowerCase().includes(query)
        );
      }),
    [roles, query, statusFilter]
  );

  const activeCount = roles.filter((role) => role.isActive).length;
  const hasFilters = Boolean(searchQuery || statusFilter);

  const renderActions = (role: Role) => (
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
            <Link href={`/admin/user/role/${role.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(role)}
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
          title="Roles"
          description="Manage the system roles that gate what each staff account can reach."
          titleIcon={<Shield className="size-6 text-primaryColor" />}
        >
          {can(MENU_URL, "canCreate") && (
            <Button asChild size="sm">
              <Link href="/admin/user/role/add">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Role</span>
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
              placeholder="Search by role name or description..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />

            <div className="md:w-35 md:shrink-0">
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) =>
                  setStatusFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery && `Search: ${searchQuery}`,
                    statusFilter &&
                    (statusFilter === "active"
                      ? "Status: Active"
                      : "Status: Inactive"),
                  ]
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
            <LoadingIndicator message="Loading roles..." />
          </div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Shield className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No roles found</p>
              <p className="text-xs text-muted-foreground">
                Get started by creating your first role.
              </p>
            </div>
            {can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/user/role/add">
                  <Plus className="size-4" /> Add Role
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={Shield}
                title="Total roles"
                value={roles.length.toLocaleString("en-US")}
                description="Configured in the system"
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="Assignable to users"
                bgColor="green"
              />
              <StatsCard
                icon={XCircle}
                title="Inactive"
                value={(roles.length - activeCount).toLocaleString("en-US")}
                description="Not currently usable"
                bgColor="red"
              />
            </div>

            {/* Roles */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Roles</h3>
                  <p className="text-xs text-muted-foreground">
                    Each role bundles the permissions its members inherit.
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {visibleRoles.length.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {visibleRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Shield className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      No roles match these filters
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try a different name or status.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop table — fixed layout. The identity Role column is
                      pinned so its icon + name aren't squeezed into a pill-
                      sized share; Description / Status / Created then split
                      the remaining width equally. Actions stays icon-only
                      at w-14 and panel edges are kept at 16px. */}
                  <div className="hidden md:block">
                    <Table className="report-table table-fixed [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                      <TableHeader className="[&_th]:font-semibold">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-48 lg:w-64 2xl:w-72">Role</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="pr-8!">Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-14 text-right">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleRoles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="py-2.5">
                              <Link
                                href={`/admin/user/role/${role.id}/edit`}
                                className="flex min-w-0 items-center gap-2.5"
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                  {getRoleIcon(role.rolename)}
                                </span>
                                <span
                                  className="truncate font-medium capitalize leading-tight hover:text-primaryColor hover:underline"
                                  title={role.rolename}
                                >
                                  {role.rolename}
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <p
                                className="line-clamp-2 text-sm text-muted-foreground"
                                title={role.description || undefined}
                              >
                                {role.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell className="pr-8!">
                              <PillBadge
                                tone={role.isActive ? "emerald" : "neutral"}
                              >
                                {role.isActive ? "Active" : "Inactive"}
                              </PillBadge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <span className="line-clamp-2">
                                {formatDateTime(role.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {renderActions(role)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y md:hidden">
                    {visibleRoles.map((role) => (
                      <article key={role.id} className="space-y-3 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/admin/user/role/${role.id}/edit`}
                            className="flex min-w-0 items-center gap-2.5"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                              {getRoleIcon(role.rolename)}
                            </span>
                            <p className="truncate text-sm font-semibold capitalize">
                              {role.rolename}
                            </p>
                          </Link>
                          {renderActions(role)}
                        </div>

                        {role.description && (
                          <p className="line-clamp-3 text-xs leading-snug wrap-break-word text-muted-foreground">
                            {role.description}
                          </p>
                        )}

                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Created
                          </p>
                          <p className="text-sm">
                            {formatDateTime(role.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Status
                          </span>
                          <PillBadge
                            tone={role.isActive ? "emerald" : "neutral"}
                          >
                            {role.isActive ? "Active" : "Inactive"}
                          </PillBadge>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Footer: what the list covers */}
                  <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                    <p className="text-xs text-muted-foreground">
                      Showing {visibleRoles.length.toLocaleString("en-US")} of{" "}
                      {roles.length.toLocaleString("en-US")} role
                      {roles.length === 1 ? "" : "s"}
                      {searchQuery && ` matching “${searchQuery}”`}
                    </p>
                  </div>
                </>
              )}
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
