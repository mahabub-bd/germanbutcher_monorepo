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
import type { SalesPartner } from "@/utils/types";
import {
  ExternalLink,
  Handshake,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function SalesPartnerList() {
  const [salesPartners, setSalesPartners] = useState<SalesPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSalesPartner, setSelectedSalesPartner] =
    useState<SalesPartner | null>(null);

  const fetchSalesPartners = async () => {
    setIsLoading(true);
    try {
      const response = await fetchData("sales-partners");
      setSalesPartners(response as SalesPartner[]);
    } catch (error) {
      console.error("Error fetching sales partners:", error);
      toast.error("Failed to load sales partners. Please try again.");
      setSalesPartners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPartners();
  }, []);

  const handleDeleteClick = (salesPartner: SalesPartner) => {
    setSelectedSalesPartner(salesPartner);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSalesPartner) return;

    try {
      await deleteData("sales-partners", selectedSalesPartner.Id);
      fetchSalesPartners();
      toast.success("Sales Partner deleted successfully");
    } catch (error) {
      console.error("Error deleting sales partner:", error);
      toast.error("Failed to delete sales partner. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      <Handshake className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No sales partners found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Get started by adding your first sales partner.
      </p>
      <Button asChild className="mt-4">
        <Link href="/admin/sales-partner/add">
          <Plus className="mr-2 h-4 w-4" /> Add Sales Partner
        </Link>
      </Button>
    </div>
  );

  const renderTableView = () => (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden md:table-cell">Website</TableHead>
            <TableHead className="hidden md:table-cell">
              Display Order
            </TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesPartners.map((salesPartner: SalesPartner) => (
            <TableRow key={salesPartner.Id}>
              <TableCell>
                <div className="overflow-hidden">
                  <Image
                    src={salesPartner?.Image?.url || "/placeholder.svg"}
                    alt={salesPartner.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{salesPartner.name}</TableCell>
              <TableCell className="hidden md:table-cell max-w-xs">
                <p className="truncate">{salesPartner.description}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {salesPartner.website ? (
                  <Link
                    href={salesPartner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {salesPartner?.order}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge
                  variant={salesPartner.isActive ? "default" : "secondary"}
                >
                  {salesPartner.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDateTime(salesPartner?.createdAt ?? "")}
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
                        href={`/admin/sales-partner/${salesPartner.Id}/edit`}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(salesPartner)}
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
          title="Sales Partners"
          description="Manage your sales partners"
          actionLabel="Add Sales Partner"
          actionHref="/admin/sales-partner/add"
        />
        {isLoading ? (
          <LoadingIndicator message="Loading Sales Partners..." />
        ) : salesPartners.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {`Showing ${salesPartners.length} sales partner${salesPartners.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {renderTableView()}
          </div>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
