"use client";

import { Check, ChevronDown, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import { Address } from "@/utils/types";

interface AddressSelectorProps {
  userId?: string;
  onAddressSelect: (address: Address) => void;
  onAddNewClick: () => void;
}

export function AddressSelector({
  userId,
  onAddressSelect,
}: AddressSelectorProps) {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

  const fetchAddresses = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await fetchProtectedData(`addresses/user/${userId}`);

      if (result && typeof result === "object") {
        if (
          "statusCode" in result &&
          "data" in result &&
          result.statusCode === 200 &&
          Array.isArray(result.data)
        ) {
          setAddresses(result.data);

          const defaultAddress = result.data.find(
            (addr: Address) => addr.isDefault
          );
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            onAddressSelect(defaultAddress);
          }
          return;
        } else if (Array.isArray(result)) {
          setAddresses(result);
          const defaultAddress = result.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            onAddressSelect(defaultAddress);
          }
          return;
        }
      }

      console.error("Unexpected API response format:", result);
      toast.error("Failed to load saved addresses", {
        description: "The server response was not in the expected format",
      });
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load saved addresses", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    onAddressSelect(address);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Saved Addresses</label>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-3"
            disabled={isLoading || !userId}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Loading addresses...</span>
              </div>
            ) : selectedAddress ? (
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedAddress.type === "shipping"
                      ? "Shipping"
                      : "Billing"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground truncate max-w-full">
                  {selectedAddress.address}, {selectedAddress.area},{" "}
                  {selectedAddress.city}
                </span>
              </div>
            ) : (
              <span>
                {userId
                  ? addresses.length > 0
                    ? "Select an address"
                    : "No saved addresses found"
                  : "Sign in to see saved addresses"}
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0">
          <Command>
            <CommandInput placeholder="Search address..." />
            <CommandList>
              <CommandEmpty>No addresses found.</CommandEmpty>
              <CommandGroup>
                {addresses.map((address) => (
                  <CommandItem
                    key={address.id}
                    value={address.id.toString()}
                    onSelect={() => handleAddressSelect(address)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {address.type === "shipping"
                            ? "Shipping Address"
                            : "Billing Address"}
                        </span>
                        {address.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {address.address}, {address.area}, {address.city}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedAddress?.id === address.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
