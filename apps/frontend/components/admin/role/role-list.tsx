"use client";

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
import { deleteData, fetchProtectedData } from "@/utils/api-utils";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "../../../lib/utils";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

// Role icon mapping — same keys as the user list's role badges.
const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-5 w-5 text-muted-foreground" />,
  superadmin: <Shield className="h-5 w-5 text-muted-foreground" />,
  modaretor: <Shield className="h-5 w-5 text-muted-foreground" />,
  manager: <Briefcase className="h-5 w-5 text-muted-foreground" />,
  storemanager: <Store className="h-5 w-5 text-muted-foreground" />,
  staff: <Users className="h-5 w-5 text-muted-foreground" />,
  customer: <User className="h-5 w-5 text-muted-foreground" />,
};

const getRoleIcon = (roleName: string | undefined) =>
  (roleName && roleIcons[roleName.trim().toLowerCase()]) || (
    <Shield className="h-5 w-5 text-muted-foreground" />
  );

export function RoleList() {
  const MENU_URL = "/admin/user/role/role-list";
  const { can } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Shield className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No roles found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Get started by adding your first role.
      </p>
      {can(MENU_URL, "canCreate") && (
        <Button asChild className="mt-4">
          <Link href="/admin/roles/add">
            <Plus className="mr-2 h-4 w-4" /> Add Role
          </Link>
        </Button>
      )}
    </div>
  );

  const renderTableView = () => (
    <div>
      <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} className="hover:bg-muted/50">
              <TableCell>
                <Link
                  href={`/admin/user/role/${role.id}/edit`}
                  className="flex items-center gap-3 font-medium leading-tight capitalize hover:underline"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                    {getRoleIcon(role.rolename)}
                  </span>
                  {role.rolename}
                </Link>
              </TableCell>
              <TableCell>
                <p className="line-clamp-1 max-w-64 text-sm text-muted-foreground">
                  {role.description || "No description"}
                </p>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    role.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400"
                  }`}
                >
                  {role.isActive ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {role.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {formatDateTime(role.createdAt)}
              </TableCell>
              <TableCell className="text-right">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full md:p-6 p-2">
        <PageHeader
          title="Roles"
          description="Manage system roles and permissions"
          {...(can(MENU_URL, "canCreate")
            ? {
                actionLabel: "Add Role",
                actionHref: "/admin/user/role/add",
              }
            : {})}
        />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingIndicator message="Loading roles..." />
          ) : roles.length === 0 ? (
            renderEmptyState()
          ) : (
            <div>{renderTableView()}</div>
          )}
        </div>

        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {roles.length} {roles.length === 1 ? "role" : "roles"}
          </div>
        </div>
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
