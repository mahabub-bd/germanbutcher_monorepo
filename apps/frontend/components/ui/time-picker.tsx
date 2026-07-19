"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import * as React from "react";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hours, setHours] = React.useState(
    value ? parseInt(value.split(":")[0]) : 0
  );
  const [minutes, setMinutes] = React.useState(
    value ? parseInt(value.split(":")[1]) : 0
  );

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    if (onChange) {
      onChange(formatTime(newHours, newMinutes));
    }
  };

  const displayValue = value || formatTime(hours, minutes);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-8 text-xs",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-3 w-3" />
          {value ? displayValue : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex divide-x">
          {/* Hours */}
          <div className="flex flex-col">
            <div className="px-3 py-2 text-xs font-semibold text-center border-b">
              Hour
            </div>
            <div className="max-h-[200px] overflow-y-auto w-40">
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => {
                    handleTimeChange(hour, minutes);
                  }}
                  className={cn(
                    "w-full px-4 py-1.5 text-xs hover:bg-accent text-left",
                    hours === hour && "bg-accent font-medium"
                  )}
                >
                  {hour.toString().padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes */}
          <div className="flex flex-col">
            <div className="px-3 py-2 text-xs font-semibold text-center border-b">
              Minute
            </div>
            <div className="max-h-[200px] overflow-y-auto w-40">
              {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => {
                    handleTimeChange(hours, minute);
                  }}
                  className={cn(
                    "w-full px-4 py-1.5 text-xs hover:bg-accent text-left",
                    minutes === minute && "bg-accent font-medium"
                  )}
                >
                  {minute.toString().padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1 p-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => {
              const now = new Date();
              handleTimeChange(now.getHours(), now.getMinutes());
              setOpen(false);
            }}
          >
            Now
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => {
              setOpen(false);
            }}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
