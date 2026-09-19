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
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";

import { deleteData, fetchData, patchData } from "@/utils/api-utils";

import { Switch } from "@/components/ui/switch";
import { ShippingMethod } from "@/utils/types";
import { MoreHorizontal, Pencil, Plus, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function ShippingMethodList() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] =
    useState<ShippingMethod | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchShippingMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData("shipping-methods");
      setShippingMethods(response as ShippingMethod[]);
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      toast.error("Failed to load shipping methods. Please try again.");
      setShippingMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const handleDeleteClick = (shippingMethod: ShippingMethod) => {
    setSelectedShippingMethod(shippingMethod);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedShippingMethod) return;

    try {
      await deleteData("shipping-methods", selectedShippingMethod.id);
      fetchShippingMethods();
      toast.success("Shipping method deleted successfully");
    } catch (error) {
      console.error("Error deleting shipping method:", error);
      toast.error("Failed to delete shipping method. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = async (method: ShippingMethod) => {
    setTogglingId(method.id);
    try {
      await patchData(`shipping-methods/${method.id}`, {
        isActive: !method.isActive,
      });
      setShippingMethods((prev) =>
        prev.map((m) =>
          m.id === method.id ? { ...m, isActive: !method.isActive } : m
        )
      );
      toast.success(
        `${method.name} ${method.isActive ? "deactivated" : "activated"}`
      );
    } catch (error) {
      console.error("Error updating shipping method:", error);
      toast.error("Failed to update shipping method status");
    } finally {
      setTogglingId(null);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Truck className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No shipping methods found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Get started by creating your first shipping method.
      </p>
      <Button asChild className="mt-4">
        <Link href="/admin/settings/shipping-method/add">
          <Plus className="mr-2 h-4 w-4" /> Add Shipping Method
        </Link>
      </Button>
    </div>
  );

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Delivery Time</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shippingMethods.map((method) => (
            <TableRow key={method.id}>
              <TableCell className="font-medium">{method.name}</TableCell>
              <TableCell>
                {formatCurrencyEnglish(Number(method?.cost))}
              </TableCell>
              <TableCell>{method.deliveryTime}</TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                {method.description}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDateTime(method.createdAt)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={method.isActive}
                    disabled={togglingId === method.id}
                    onCheckedChange={() => handleToggleActive(method)}
                    aria-label={`Toggle ${method.name}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {method.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
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
                      <Link
                        href={`/admin/settings/shipping-method/${method.id}/edit`}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(method)}
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
          title="Shipping Methods"
          description="Manage shipping options for your store"
          actionLabel="Add Shipping Method"
          actionHref="/admin/settings/shipping-method/add"
        />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingIndicator message="Loading shipping methods..." />
          ) : shippingMethods.length === 0 ? (
            renderEmptyState()
          ) : (
            <div>{renderTableView()}</div>
          )}
        </div>

        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {shippingMethods.length}{" "}
            {shippingMethods.length === 1
              ? "shipping method"
              : "shipping methods"}
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
