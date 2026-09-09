"use client";

import type { Address } from "@/utils/types";
import { MapPin, Phone, User } from "lucide-react";

interface ShippingAddressProps {
  address: Address;
  userName: string;
  userMobileNumber: string;
}

export function ShippingAddress({
  address,
  userName,
  userMobileNumber,
}: ShippingAddressProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center border-b bg-muted/30 px-3 py-2.5">
        <h3 className="flex items-center text-sm font-semibold">
          <MapPin className="mr-1.5 size-4 text-primary" />
          Shipping Address
        </h3>
      </div>

      <div className="space-y-2.5 p-3">
        <div className="flex items-center gap-1.5 text-sm">
          <User className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Name</span>
          <span className="font-medium">{userName}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <Phone className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Phone</span>
          <span className="font-medium">{userMobileNumber}</span>
        </div>

        <div className="border-t pt-2.5">
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="break-words text-sm leading-snug">
                {address.address}, {address.area}, {address.city},{" "}
                {address.division}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
