"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface CountdownTimerProps {
  endsAt: string | Date | null | undefined;
  variant?: "pill" | "banner";
  className?: string;
}

function calculateTimeRemaining(endDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const difference = end - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    isExpired: false,
  };
}

/** Live countdown extracted from the old product-card timer. Renders
 * nothing once expired (or when endsAt is missing). */
export function CountdownTimer({
  endsAt,
  variant = "pill",
  className = "",
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );

  useEffect(() => {
    if (!endsAt) return;

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining(new Date(endsAt)));

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(new Date(endsAt));
      setTimeRemaining(remaining);

      // Clear interval if expired
      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt || !timeRemaining || timeRemaining.isExpired) return null;

  if (variant === "banner") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm ${className}`}
      >
        <Clock size={12} />
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {String(timeRemaining.hours).padStart(2, "0")}:
        {String(timeRemaining.minutes).padStart(2, "0")}:
        {String(timeRemaining.seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className={`bg-black/60 backdrop-blur-sm rounded-sm px-2 py-1 shadow-lg ${className}`}>
      <div className="flex items-center gap-1 text-white text-xs font-bold">
        <Clock size={10} />
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {String(timeRemaining.hours).padStart(2, "0")}:
        {String(timeRemaining.minutes).padStart(2, "0")}:
        {String(timeRemaining.seconds).padStart(2, "0")}
      </div>
    </div>
  );
}
