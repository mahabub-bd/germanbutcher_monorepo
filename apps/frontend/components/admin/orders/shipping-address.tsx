"use client";

import { MapPin, Phone, User } from "lucide-react";
import type { Address } from "@/utils/types";

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
    <div className="border rounded-lg bg-card shadow-sm">
      <div className="px-4 py-3 border-b">
        <h3 className="text-base font-semibold flex items-center">
          <MapPin className="size-4 mr-2 text-primary" />
          Shipping Address
        </h3>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="size-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Name:</span>
          <span className="font-medium">{userName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="size-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Phone:</span>
          <span className="font-medium">{userMobileNumber}</span>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-start gap-2">
            <MapPin className="size-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed break-words">
                {address.address}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {address.area}, {address.city}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.division}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
