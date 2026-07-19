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
import type { PaymentMethod } from "@/utils/types";
import { CreditCard, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function PaymentMethodList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData("order-payment-methods");
      setPaymentMethods(response as PaymentMethod[]);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods. Please try again.");
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleDeleteClick = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPaymentMethod) return;

    try {
      await deleteData("order-payment-methods", selectedPaymentMethod.id);
      fetchPaymentMethods();
      toast.success("Payment method deleted successfully");
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No payment methods found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Get started by creating your first payment method.
      </p>
      <Button asChild className="mt-4">
        <Link href="/admin/settings/payment-method/add">
          <Plus className="mr-2 h-4 w-4" /> Add Payment Method
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
            <TableHead>Code</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentMethods.map((method) => (
            <TableRow key={method.id}>
              <TableCell className="font-medium">{method.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {method.code}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={method.isActive ? "default" : "secondary"}>
                  {method.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                {method.description}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDateTime(method.createdAt)}
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
                        href={`/admin/settings/payment-method/${method.id}/edit`}
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
          title="Payment Methods"
          description="Manage payment options for your store"
          actionLabel="Add Payment Method"
          actionHref="/admin/settings/payment-method/add"
        />

        <div className="space-y-4">
          {isLoading ? (
            <LoadingIndicator message="Loading payment methods..." />
          ) : paymentMethods.length === 0 ? (
            renderEmptyState()
          ) : (
            <div>{renderTableView()}</div>
          )}
        </div>

        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {paymentMethods.length}{" "}
            {paymentMethods.length === 1 ? "payment method" : "payment methods"}
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
