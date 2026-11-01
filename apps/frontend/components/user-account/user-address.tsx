"use client";

import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { deleteData } from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import { Address } from "@/utils/types";
import {
  Building2,
  CircleCheck,
  FileText,
  Globe2,
  MapPin,
  Milestone,
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
              className="px-3 py-1.5 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 h-auto"
              onClick={handleAddAddress}
            >
              <Plus className="w-4 h-4" />
              Add New
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
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors flex items-center gap-2 h-auto"
            onClick={handleAddAddress}
          >
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
        {sortedAddresses.map((address) => {
          const isDeleting = deletingId === address.id;
          const canDelete = canDeleteAddress(address);
          const Icon = address.type === "billing" ? FileText : MapPin;

          // Each field keeps a label and an icon; Address spans the full
          // width and Area/City/Division share a two-column grid so the
          // card stays compact.
          const fields: {
            label: string;
            value: string;
            icon: typeof MapPin;
            full?: boolean;
          }[] = [
              { label: "Address", value: address.address, icon: MapPin, full: true },
              { label: "Area", value: address.area, icon: Milestone },
              { label: "City", value: address.city, icon: Building2 },
              { label: "Division", value: address.division, icon: Globe2 },
            ];

          return (
            <div
              key={address.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-primaryColor">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold capitalize text-gray-900">
                      {address.type} Address
                    </h2>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      <CircleCheck className="h-3 w-3 fill-green-600 text-white" />
                      Default
                    </span>
                  )}
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-primaryColor transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="flex h-7 w-7 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-gray-100 pt-3">
                {fields.map((field) => {
                  const FieldIcon = field.icon;
                  return (
                    <div
                      key={field.label}
                      className={`flex items-start gap-2${field.full ? " col-span-2" : ""
                        }`}
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-50 text-gray-500">
                        <FieldIcon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm wrap-break-word">
                          <span className="text-[11px] uppercase tracking-wide text-slate-500">
                            {field.label}:
                          </span>{" "}
                          <span className="font-medium text-gray-900">
                            {field.value || "—"}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
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
