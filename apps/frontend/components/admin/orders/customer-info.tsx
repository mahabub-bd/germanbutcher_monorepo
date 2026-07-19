"use client";

import type { User } from "@/utils/types";
import { Mail, Phone, User as UserIcon } from "lucide-react";

interface CustomerInfoProps {
  user: User & {
    mobileNumber?: string;
  };
}

export function CustomerInfo({ user }: CustomerInfoProps) {
  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm">
      <div className="pb-3 border-b mb-3">
        <h3 className="text-base font-semibold flex items-center">
          <UserIcon className="size-4 mr-2 text-primary" />
          Customer Information
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="size-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{user.name}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Mail className="size-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-muted-foreground">{user.email || "N/A"}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="size-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{user.mobileNumber || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}
