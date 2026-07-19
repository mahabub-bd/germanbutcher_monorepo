"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange?: (value: Date) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  React.useEffect(() => {
    if (value) {
      setDate(new Date(value));
    }
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate && onChange) {
      onChange(selectedDate);
    }
  };

  const minDateObj = minDate ? new Date(minDate) : undefined;
  const maxDateObj = maxDate ? new Date(maxDate) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          disabled={(date) => {
            if (minDateObj && date < minDateObj) return true;
            if (maxDateObj && date > maxDateObj) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
