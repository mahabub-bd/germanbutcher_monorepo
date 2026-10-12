"use client";

import { deleteData } from "@/utils/api-utils";
import { AccountPageHeader } from "@/components/user-account/account-page-header";
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
      <div className="w-full md:p-4 p-2">
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
    <div className="w-full md:p-4 p-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 items-start">
        {sortedAddresses.map((address) => {
          const isDeleting = deletingId === address.id;
          const canDelete = canDeleteAddress(address);
          const Icon = address.type === "billing" ? FileText : MapPin;

          const fields = [
            { label: "Address", value: address.address },
            { label: "Area", value: address.area },
            { label: "City", value: address.city },
            { label: "Division", value: address.division },
          ];

          return (
            <div
              key={address.id}
              className="p-3.5 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-center pb-3 mb-3.5 sm:pb-4 sm:mb-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  <span className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-primaryColor">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <h2 className="text-sm sm:text-xl font-bold text-gray-900 capitalize">
                    {address.type} Address
                  </h2>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-base font-medium text-primaryColor transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleEditAddress(address)}
                    disabled={isDeleting}
                  >
                    <PencilLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Edit
                  </button>
                  {canDelete && (
                    <>
                      <span className="h-4 w-px sm:h-5 bg-gray-200" aria-hidden />
                      <button
                        type="button"
                        className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-base font-medium text-red-600 transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDeleteClick(address)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-4">
                {fields.map((field) => (
                  <div key={field.label} className="flex items-start gap-2.5 sm:gap-4">
                    <span className="w-20 sm:w-28 lg:w-36 shrink-0 text-xs sm:text-base text-gray-500">
                      {field.label}
                    </span>
                    <span className="text-xs sm:text-base font-medium text-gray-900 break-words">
                      {field.value}
                    </span>
                  </div>
                ))}
                {address.isDefault && (
                  <div className="pt-0.5 sm:pt-1">
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-green-100 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-green-700">
                      <CircleCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-green-600 text-white" />
                      Default {address.type} address
                    </span>
                  </div>
                )}
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
