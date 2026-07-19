"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProtectedData, patchData } from "@/utils/api-utils";
import type { DeliveryMan } from "@/utils/types";
import {
  CheckCircle2,
  Loader2,
  Truck,
  Unlink,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AssignDeliveryManProps {
  orderId: number;
  deliveryMan?: DeliveryMan | null;
  onAssignmentChange?: (deliveryMan: DeliveryMan | null) => void;
  orderStatus?: string;
}

export function AssignDeliveryMan({
  orderId,
  deliveryMan,
  onAssignmentChange,
  orderStatus,
}: AssignDeliveryManProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    deliveryMan?.id.toString()
  );

  useEffect(() => {
    if (!open) return;

    const loadDeliveryMen = async () => {
      setLoading(true);
      try {
        const data = await fetchProtectedData<DeliveryMan[]>(
          "delivery-man/active"
        );
        setDeliveryMen(data);
      } catch {
        toast.error("Failed to load delivery men");
      } finally {
        setLoading(false);
      }
    };

    loadDeliveryMen();
  }, [open]);

  const assignDeliveryMan = async (deliveryManId: number | null) => {
    setAssigning(true);
    try {
      await patchData(`orders/${orderId}/assign-delivery-man`, {
        deliveryManId,
      });

      const assigned =
        deliveryManId === null
          ? null
          : deliveryMen.find((dm) => dm.id === deliveryManId) || null;

      onAssignmentChange?.(assigned);
      toast.success(
        deliveryManId ? "Delivery man assigned" : "Delivery man unassigned"
      );
      setOpen(false);
    } catch {
      toast.error("Action failed");
    } finally {
      setAssigning(false);
    }
  };

  const isDelivered = orderStatus?.toLowerCase() === "delivered";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDelivered}
          className={
            deliveryMan
              ? "border-green-500/30 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-500/20 dark:text-green-400 dark:hover:bg-green-950"
              : ""
          }
        >
          {deliveryMan ? (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
               {isDelivered ? "Cannot Reassign" : "Reassign Delivery Man"}
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Delivery Man
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {deliveryMan ? "Change Delivery Man" : "Assign Delivery Man"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="ml-9">
            {deliveryMan
              ? "Change the delivery man currently assigned to this order."
              : "Select an available delivery man to assign this order."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Current Delivery Man */}
          {deliveryMan && (
            <div className="relative overflow-hidden rounded-lg border-2 border-green-500/20 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-green-500/10 to-transparent" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-start gap-3">
                  
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-blue-100">
                      {deliveryMan.name} - {deliveryMan.mobileNumber}
                    </p>
                   
                 
                  </div>
                </div>
                <Badge
                  variant="default"
                  className="gap-1 bg-green-600 hover:bg-green-700 shadow-sm"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Assigned
                </Badge>
              </div>
            </div>
          )}

          {/* Select Dropdown */}
          <div className="space-y-2 min-w-full">
            <label className="text-sm font-semibold flex items-center gap-2">
              {deliveryMan ? (
                <>
                  <UserPlus className="h-4 w-4 text-primary" />
                  Select New Delivery Man
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 text-primary" />
                  Select Delivery Man
                </>
              )}
            </label>
            <Select
              value={selectedId}
              onValueChange={setSelectedId}
              disabled={loading}
            >
              <SelectTrigger className="h-11">
                <SelectValue
                  placeholder={
                    loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading delivery men...
                      </div>
                    ) : (
                      "Select a delivery man from the list"
                    )
                  }
                />
              </SelectTrigger>
              <SelectContent className="w-full min-w-[var(--radix-select-trigger-width)] max-h-[300px]">
                {deliveryMen.length === 0 && !loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No active delivery men available
                  </div>
                ) : (
                  deliveryMen.map((dm) => (
                    <SelectItem
                      key={dm.id}
                      value={dm.id.toString()}
                      className="focus:bg-primary/10"
                    >
                      <div className="flex items-center justify-between gap-2 w-full min-w-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <span className="font-medium text-sm truncate">{dm.name} - {dm.mobileNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                          <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                            <Truck className="h-3 w-3" />
                            {dm.totalDeliveries}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Delivery Man Preview */}
          {selectedId && (() => {
            const selectedDm = deliveryMen.find(
              (dm) => dm.id === parseInt(selectedId || "")
            );
            return selectedDm ? (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedDm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDm.mobileNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-primary">
                      {selectedDm.totalDeliveries} deliveries
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ৳{Number(selectedDm.totalEarnings).toFixed(0)} total
                    </p>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 h-10"
              disabled={!selectedId || assigning}
              onClick={() => assignDeliveryMan(Number(selectedId))}
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {deliveryMan ? "Changing..." : "Assigning..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {deliveryMan ? "Change Assignment" : "Assign Delivery Man"}
                </>
              )}
            </Button>

            {deliveryMan && (
              <Button
                variant="outline"
                disabled={assigning}
                onClick={() => assignDeliveryMan(null)}
                className="h-10 border-red-500/30 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-950"
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-2" />
                    Unassign
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
