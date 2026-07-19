"use client";

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

interface GoToTopProps {
  threshold?: number;
  className?: string;
}

export function GoToTop({ threshold = 300, className }: GoToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-8 hidden md:flex right-4 p-3 rounded-full text-white shadow-md z-50 transition-all duration-300 bg-primaryColor hover:bg-primaryColor/90",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none",
        className
      )}
      aria-label="Go to top"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
