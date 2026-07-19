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
import { formatDateTime } from "@/lib/utils";
import { deleteData, fetchData } from "@/utils/api-utils";
import { Unit } from "@/utils/types";
import { MoreHorizontal, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../../delete-confirmation-dialog";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

export function UnitList() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const response = (await fetchData("units")) as Unit[];
      setUnits(response);
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

    try {
      await deleteData("units", selectedUnit.id);
      fetchUnits();
      toast.success("Unit deleted successfully");
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error("Failed to delete unit. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Scale className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No units found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Get started by adding your first unit.
      </p>
      <Button asChild className="mt-4">
        <Link href="/admin/products/units/add">
          <Plus className="mr-2 h-4 w-4" /> Add Unit
        </Link>
      </Button>
    </div>
  );

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit Name</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell className="font-medium capitalize">
                {unit.name}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={unit.isActive ? "default" : "secondary"}>
                  {unit.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDateTime(unit.createdAt)}
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
                      <Link href={`/admin/products/units/${unit.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(unit)}
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
          title="Units"
          description="Manage measurement units for products"
          actionLabel="Add Unit"
          actionHref="/admin/products/units/add"
        />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingIndicator message="Loading units..." />
          ) : units.length === 0 ? (
            renderEmptyState()
          ) : (
            <div>{renderTableView()}</div>
          )}
        </div>

        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {units.length} {units.length === 1 ? "unit" : "units"}
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        defaultToast={false}
      />
    </>
  );
}
