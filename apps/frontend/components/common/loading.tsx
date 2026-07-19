"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface RouteLoadingBarProps {
  height?: string;
  position?: "top" | "bottom";
  color?: string;
  showOnRouteChange?: boolean;
  delay?: number;
  speed?: number;
}

export default function RouteLoadingBar({
  height = "3px",
  position = "top",
  color = "#ffffff",
  showOnRouteChange = true,

  speed = 100, // Faster updates
}: RouteLoadingBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const intervalRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!showOnRouteChange) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsLoading(true);
    setProgress(10);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 85;
        }

        const increment = prev < 50 ? Math.random() * 25 : Math.random() * 10;
        return Math.min(prev + increment, 85);
      });
    }, speed);

    timeoutRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 150); // Faster completion
    }, 50); // Much faster completion trigger

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname, searchParams, showOnRouteChange, speed]);

  if (!isLoading) return null;

  const positionClass = position === "top" ? "top-0" : "bottom-0";

  return (
    <>
      <div
        className={`fixed left-0 right-0 ${positionClass} z-[9999] overflow-hidden bg-gray-200/10 dark:bg-gray-800/10`}
        style={{ height }}
      >
        <div
          className="h-full transition-all duration-200 ease-out relative"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: color,
            boxShadow: "0 0 8px rgba(255, 255, 255, 0.4)",
          }}
        >
          {/* Optimized shimmer effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
              animation: "shimmer 1s infinite",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(150%);
          }
        }
      `}</style>
    </>
  );
}
