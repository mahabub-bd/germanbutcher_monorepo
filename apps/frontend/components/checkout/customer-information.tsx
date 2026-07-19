"use client";

import {
  Check,
  CheckCircle,
  Edit,
  Loader2,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { patchData } from "@/utils/api-utils";
import type { User as UserType } from "@/utils/types";

interface CustomerInformationProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
  onVerifyPhone: (phone: string) => Promise<void>;
  isVerified: boolean;
  user?: UserType;
}

export function CustomerInformation({
  formData,
  onChange,
  onVerifyPhone,
  isVerified,
  user,
}: CustomerInformationProps) {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  const handleUpdateUserInfo = async () => {
    const { name, email } = formData;

    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsUpdatingInfo(true);
    try {
      const userIdToUpdate = user?.id;
      if (!userIdToUpdate) {
        toast.error("User ID not available");
        return;
      }

      await patchData(`users/${userIdToUpdate}`, {
        name,
        email,
      });

      toast.success("Profile information updated successfully");
      setIsEditingInfo(false);
    } catch (error) {
      console.error("Error updating user info:", error);
      toast.error("Failed to update profile information");
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 bg-white rounded-lg border p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 border-b pb-3 md:pb-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <div>
            <h2 className="text-base md:text-lg font-semibold">
              Customer Information
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Enter your contact details
            </p>
          </div>
        </div>
        {(isVerified || user) && !isEditingInfo && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditingInfo(true)}
            className="text-xs md:text-sm"
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
        {isEditingInfo && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingInfo(false)}
              className="text-xs md:text-sm"
              disabled={isUpdatingInfo}
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleUpdateUserInfo}
              className="text-xs md:text-sm"
              disabled={isUpdatingInfo}
            >
              {isUpdatingInfo ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" /> Save
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4 md:space-y-5">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Your full name"
              disabled={
                !isEditingInfo &&
                ((!!user && !isVerified) || (isVerified && !isEditingInfo))
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="your@email.com"
              disabled={
                !isEditingInfo &&
                ((!!user && !isVerified) || (isVerified && !isEditingInfo))
              }
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="phone">Phone Number *</Label>
            {(isVerified || user) && (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>

          <div className="flex gap-2 items-stretch mt-1">
            <div className="relative flex-1">
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="01XXXXXXXXX"
                className={cn(
                  "pr-10",
                  (isVerified || user) && "border-green-500 bg-green-50"
                )}
                disabled={!!user || isVerified}
              />
              {(isVerified || user) && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>

            {!user && !isVerified && (
              <Button
                type="button"
                variant={formData.phone ? "default" : "outline"}
                onClick={() => onVerifyPhone(formData.phone)}
                disabled={!formData.phone}
                className="shrink-0 w-24 justify-center"
              >
                <ShieldAlert className="h-4 w-4 mr-1" />
                Verify
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
