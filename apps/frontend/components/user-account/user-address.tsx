"use client";

import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { cn } from "@/lib/utils";
import { deleteData } from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import { Address } from "@/utils/types";
import {
  CircleCheck,
  FileText,
  MapPin,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import AddressDialog from "./AddressDialogForm";

interface MyAddressProps {
  addresses: Address[];
  userId: string;
  onAddressDeleted?: () => void; // Callback to refresh data
}

export default function MyAddress({
  addresses,
  userId,
  onAddressDeleted,
}: MyAddressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setDialogMode("add");
    setIsOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setDialogMode("edit");
    setIsOpen(true);
  };

  const handleDeleteClick = (address: Address) => {
    setAddressToDelete(address);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;

    setDeletingId(addressToDelete.id);

    try {
      await deleteData(`addresses`, addressToDelete.id);
      toast.success("Address deleted successfully");

      serverRevalidate(`/user/${userId}/addresses`);
      if (onAddressDeleted) {
        onAddressDeleted();
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const canDeleteAddress = (address: Address) => {
    const sameTypeAddresses = addresses.filter(
      (addr) => addr.type === address.type
    );
    return sameTypeAddresses.length > 1 || !address.isDefault;
  };

  // Default addresses first, then the rest in their original order.
  const sortedAddresses = [...(addresses ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault)
  );

  if (!addresses || addresses.length === 0) {
    return (
      <div className="w-full">
        <AccountPageHeader
          title="Manage Addresses"
          action={
            <Button
              size="sm"
              className="rounded-lg font-semibold sm:h-9 sm:px-5 sm:text-sm"
              onClick={handleAddAddress}
              title="Add New Address"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Add New</span>
            </Button>
          }
        />
        <div className="p-6 sm:p-7 bg-white rounded-xl border border-gray-200">
          <div className="text-center py-10">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No addresses added yet</p>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-primaryColor rounded-md transition-colors"
              onClick={handleAddAddress}
            >
              Add Address
            </button>
          </div>
        </div>

        {isOpen && (
          <AddressDialog
            open={isOpen}
            setOpen={setIsOpen}
            address={editingAddress}
            mode={dialogMode}
            userId={userId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <AccountPageHeader
        title="Manage Addresses"
        action={
          <Button
            size="sm"
            className="rounded-lg font-semibold sm:h-9 sm:px-5 sm:text-sm"
            onClick={handleAddAddress}
            title="Add New Address"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Add New</span>
          </Button>
        }
      />

      {/* Stretch (no items-start) keeps cards in a row equal height so the
          geo footer anchors at the bottom. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sortedAddresses.map((address) => {
          const isDeleting = deletingId === address.id;
          const canDelete = canDeleteAddress(address);
          const Icon = address.type === "billing" ? FileText : MapPin;
          const isBilling = address.type === "billing";

          // Second line: Label · City · Division — joins only the parts
          // that exist, so a missing value doesn't leave a dangling dot.
          const meta = [address.label, address.city, address.division]
            .filter(Boolean)
            .join(" · ");

          return (
            <div
              key={address.id}
              className="relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header: type icon + title, Default pill, actions */}
              <div className="flex items-start justify-between gap-2 p-4 pb-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isBilling
                        ? "bg-blue-50 text-blue-600"
                        : "bg-red-50 text-primaryColor"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="truncate text-sm font-semibold capitalize text-gray-900">
                    {address.type} Address
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <CircleCheck className="h-3 w-3 fill-emerald-600 text-white" />
                      Default
                    </span>
                  )}
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-primaryColor disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleEditAddress(address)}
                    disabled={isDeleting}
                    title="Edit address"
                    aria-label="Edit address"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDeleteClick(address)}
                      disabled={isDeleting}
                      title="Delete address"
                      aria-label="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Body: the address itself is the hero — street line large,
                  then Label · City · Division on the next line */}
              <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                <div className="min-w-0 space-y-1">
                  <p className="wrap-break-word text-[15px] font-semibold leading-snug text-gray-900">
                    {address.address || "—"}
                  </p>
                  {meta && (
                    <p className="wrap-break-word text-sm leading-snug capitalize text-gray-500">
                      {meta}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Address Dialog */}
      {isOpen && (
        <AddressDialog
          open={isOpen}
          setOpen={setIsOpen}
          address={editingAddress}
          mode={dialogMode}
          userId={userId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot
              be undone.
              {addressToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-gray-900">
                    {addressToDelete.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    {addressToDelete.area}, {addressToDelete.city},{" "}
                    {addressToDelete.division}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingId !== null ? "Deleting..." : "Delete Address"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
