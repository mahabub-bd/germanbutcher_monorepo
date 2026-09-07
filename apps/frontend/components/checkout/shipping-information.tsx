"use client";

import { AddressSelector } from "@/components/checkout/address-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Address, User as UserType } from "@/utils/types";
import { MapPin } from "lucide-react";

interface ShippingInformationProps {
  formData: {
    address: string;
    area: string;
    city: string;
    division: string;
  };
  onChange: (field: string, value: string) => void;
  user?: UserType;
  onAddressSelect: (addressId: number, addressData: Address) => void;
  onAddNewClick: () => void;
  showAddressForm: boolean;
  errors?: Record<string, string>;
}

export function ShippingInformation({
  formData,
  onChange,
  user,
  onAddressSelect,
  onAddNewClick,
  showAddressForm,
  errors,
}: ShippingInformationProps) {
  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address.id, address);
  };

  return (
    <div className="space-y-4 md:space-y-5 bg-white rounded-lg border p-4 md:p-6">
      <div className="flex items-center gap-2 border-b pb-3 md:pb-4">
        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        <div>
          <h2 className="text-base md:text-lg font-semibold">
            Shipping Information
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Where should we deliver your order?
          </p>
        </div>
      </div>

      <div className="space-y-4 md:space-y-5">
        {user && (
          <AddressSelector
            userId={String(user.id)}
            onAddressSelect={handleAddressSelect}
            onAddNewClick={onAddNewClick}
          />
        )}

        {showAddressForm && (
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 text-md">
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => onChange("address", e.target.value)}
                placeholder="House #, Road #, Area"
                aria-invalid={!!errors?.address}
                className="mt-1 w-full"
              />
              {errors?.address && (
                <p className="mt-1 text-xs text-red-500">{errors.address}</p>
              )}
            </div>

            <div>
              <Label htmlFor="area">Area *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => onChange("area", e.target.value)}
                placeholder="Your area (e.g., Badda, Gulshan)"
                aria-invalid={!!errors?.area}
                className="mt-1 w-full"
              />
              {errors?.area && (
                <p className="mt-1 text-xs text-red-500">{errors.area}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => onChange("city", e.target.value)}
                placeholder="Your city"
                aria-invalid={!!errors?.city}
                className="mt-1 w-full"
              />
              {errors?.city && (
                <p className="mt-1 text-xs text-red-500">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="division">Division *</Label>
              <Select
                value={formData.division}
                onValueChange={(value) => onChange("division", value)}
              >
                <SelectTrigger
                  id="division"
                  aria-invalid={!!errors?.division}
                  className="mt-1 w-full"
                >
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dhaka">Dhaka</SelectItem>
                  <SelectItem value="Chittagong">Chittagong</SelectItem>
                  <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                  <SelectItem value="Khulna">Khulna</SelectItem>
                  <SelectItem value="Barisal">Barisal</SelectItem>
                  <SelectItem value="Sylhet">Sylhet</SelectItem>
                  <SelectItem value="Rangpur">Rangpur</SelectItem>
                  <SelectItem value="Mymensingh">Mymensingh</SelectItem>
                </SelectContent>
              </Select>
              {errors?.division && (
                <p className="mt-1 text-xs text-red-500">{errors.division}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
