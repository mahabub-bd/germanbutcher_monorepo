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
              // flex-1 + min-w-0 is what actually lets the truncate below
              // work: the Button is whitespace-nowrap, so without a bounded
              // width the long address just widens the whole field.
              <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                <div className="flex min-w-0 items-center">
                  <MapPin className="h-4 w-4 mr-1 shrink-0 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedAddress.type === "shipping"
                      ? "Shipping"
                      : "Billing"}
                  </span>
                </div>
                <span

                  className="w-full whitespace-normal wrap-break-word text-sm leading-snug text-muted-foreground sm:truncate"
                  // Full text on hover/touch for long addresses
                  title={`${selectedAddress.address}, ${selectedAddress.area}, ${selectedAddress.city}`}
                >
                  {selectedAddress.address}, {selectedAddress.area},{" "}
                  {selectedAddress.city}
                </span>
              </div>
            ) : (
              <span className="min-w-0 flex-1 truncate">
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
        <PopoverContent
          // Follow the trigger width instead of a fixed 350px (which overflowed
          // small screens), and never exceed the viewport minus margins.
          className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0"
        >
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
                    className="cursor-pointer items-start"
                  >
                    <div className="flex min-w-0 flex-col w-full gap-0.5">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-medium">
                          {address.type === "shipping"
                            ? "Shipping Address"
                            : "Billing Address"}
                          {address.label && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground capitalize">
                              ({address.label})
                            </span>
                          )}
                        </span>
                        {address.isDefault && (
                          <span className="shrink-0 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      {/* cmdk forces nowrap on items — allow the full address
                          to wrap inside the dropdown instead of clipping it. */}
                      <span className="whitespace-normal wrap-break-word text-sm leading-snug text-muted-foreground">
                        {address.address}, {address.area}, {address.city}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto mt-0.5 h-4 w-4 shrink-0",
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
