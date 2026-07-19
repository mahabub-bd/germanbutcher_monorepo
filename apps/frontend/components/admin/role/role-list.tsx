"use client";

import { Badge } from "@/components/ui/badge";
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
import type { Role } from "@/utils/types";
import { MoreHorizontal, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "../../../lib/utils";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function RoleList() {
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
      <Button asChild className="mt-4">
        <Link href="/admin/roles/add">
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Link>
      </Button>
    </div>
  );

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
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
            <TableRow key={role.id}>
              <TableCell className="font-medium capitalize">
                {role.rolename}
              </TableCell>
              <TableCell>{role.description || "No description"}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={role.isActive ? "default" : "secondary"}>
                  {role.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
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
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/user/role/${role.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(role)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
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
          actionLabel="Add Role"
          actionHref="/admin/user/role/add"
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
