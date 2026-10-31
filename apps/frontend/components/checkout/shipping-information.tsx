"use client";

import { AddressSelector } from "@/components/checkout/address-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  getAreaPricing,
  getEnabledAreas,
  getEnabledCities,
  getEnabledDivisions,
} from "@/lib/delivery-coverage";
import type { Address, User as UserType } from "@/utils/types";
import { MapPin } from "lucide-react";
import { useEffect } from "react";

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
  const settings = useBusinessSettings();
  const coverage = settings?.deliveryCoverage ?? null;
  // Only coverage-enabled options are selectable; a field with no enabled
  // options left is hidden entirely.
  const enabledDivisions = getEnabledDivisions(coverage);
  const enabledCities = getEnabledCities(coverage, formData.division);
  const enabledAreas = getEnabledAreas(coverage, formData.city);
  // Area-wise pricing shown under the Area field once an area is chosen.
  const areaPricing = getAreaPricing(coverage, formData.area, formData.city);
  const showDivisionField = enabledDivisions.length > 0;
  const showCityField = enabledCities.length > 0;
  const showAreaField = enabledAreas.length > 0;

  // Pre-select when only one option is servable (e.g. Dhaka-only coverage).
  useEffect(() => {
    if (!showAddressForm) return;
    if (showDivisionField && !formData.division && enabledDivisions.length === 1) {
      onChange("division", enabledDivisions[0]);
    }
  }, [showAddressForm, showDivisionField, enabledDivisions, formData.division, onChange]);

  useEffect(() => {
    if (!showAddressForm) return;
    if (showCityField && !formData.city && enabledCities.length === 1) {
      onChange("city", enabledCities[0]);
    }
  }, [showAddressForm, showCityField, enabledCities, formData.city, onChange]);

  useEffect(() => {
    if (!showAddressForm) return;
    if (showAreaField && !formData.area && enabledAreas.length === 1) {
      onChange("area", enabledAreas[0]);
    }
  }, [showAddressForm, showAreaField, enabledAreas, formData.area, onChange]);

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
            {showDivisionField && (
              <div>
                <Label htmlFor="division">Division *</Label>
                <Select
                  value={formData.division}
                  onValueChange={(value) => {
                    if (value !== formData.division) {
                      onChange("city", "");
                      onChange("area", "");
                    }
                    onChange("division", value);
                  }}
                >
                  <SelectTrigger
                    id="division"
                    aria-invalid={!!errors?.division}
                    className="mt-1 w-full"
                  >
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledDivisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors?.division && (
                  <p className="mt-1 text-xs text-red-500">{errors.division}</p>
                )}
              </div>
            )}

            {showCityField && (
              <div>
                <Label htmlFor="city">City *</Label>
                <SearchableSelect
                  value={formData.city}
                  onValueChange={(value) => {
                    if (value !== formData.city) {
                      onChange("area", "");
                    }
                    onChange("city", value);
                  }}
                  options={enabledCities}
                  placeholder={
                    showDivisionField
                      ? formData.division
                        ? "Select City"
                        : "Select Division first"
                      : "Select City"
                  }
                  searchPlaceholder="Search city..."
                  disabled={showDivisionField && !formData.division}
                  className="mt-1"
                />
                {errors?.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                )}
              </div>
            )}

            {showAreaField && (
              <div>
                <Label htmlFor="area">Area *</Label>
                <SearchableSelect
                  value={formData.area}
                  onValueChange={(value) => onChange("area", value)}
                  options={enabledAreas}
                  placeholder={
                    showCityField
                      ? formData.city
                        ? "Select Area"
                        : "Select City first"
                      : "Select Area"
                  }
                  searchPlaceholder="Search area..."
                  emptyMessage="No area found."
                  disabled={showCityField && !formData.city}
                  className="mt-1"
                />
                {errors?.area && (
                  <p className="mt-1 text-xs text-red-500">{errors.area}</p>
                )}
                {formData.area &&
                  (areaPricing.deliveryCharge != null ||
                    areaPricing.minOrderAmount != null ||
                    areaPricing.deliveryTime) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {areaPricing.deliveryCharge != null && (
                        <span>
                          Delivery charge: ৳{areaPricing.deliveryCharge}
                        </span>
                      )}
                      {areaPricing.deliveryCharge != null &&
                        areaPricing.minOrderAmount != null &&
                        " · "}
                      {areaPricing.minOrderAmount != null && (
                        <span>
                          Minimum order: ৳{areaPricing.minOrderAmount}
                        </span>
                      )}
                      {(areaPricing.deliveryCharge != null ||
                        areaPricing.minOrderAmount != null) &&
                        areaPricing.deliveryTime &&
                        " · "}
                      {areaPricing.deliveryTime && (
                        <span>Delivery time: {areaPricing.deliveryTime}</span>
                      )}
                    </p>
                  )}
              </div>
            )}

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => onChange("address", e.target.value)}
                placeholder="House #, Road #"
                aria-invalid={!!errors?.address}
                className="mt-1 w-full"
              />
              {errors?.address && (
                <p className="mt-1 text-xs text-red-500">{errors.address}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
