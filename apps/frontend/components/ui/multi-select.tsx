"use client";

import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronDown, X } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";

export interface Option {
  value: number;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      selected,
      onChange,
      placeholder = "Select items...",
      className,
      disabled = false,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const handleUnselect = (value: number) => {
      onChange(selected.filter((item) => item !== value));
    };

    const handleToggle = (value: number) => {
      if (selected.includes(value)) {
        onChange(selected.filter((item) => item !== value));
      } else {
        onChange([...selected, value]);
      }
    };

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    useEffect(() => {
      if (selected.length === 0) {
        setSearchValue("");
      }
    }, [selected]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between text-left font-normal",
              selected.length > 0 && "h-auto min-h-10 py-2",
              className
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1">
              {selected.length > 0 ? (
                selected.map((value) => {
                  const label =
                    options.find((option) => option.value === value)?.label ??
                    String(value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="mr-1 mb-1"
                    >
                      {label}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onPointerDown={(e) => {
                          // Keep the trigger's popover from toggling —
                          // Radix acts on pointerdown, before click.
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(value);
                        }}
                      />
                    </Badge>
                  );
                })
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      handleToggle(option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
