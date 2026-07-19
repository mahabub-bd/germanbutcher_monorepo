import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo } from "react";

interface CarouselControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
  className?: string;
}

export const CarouselControls = memo(function CarouselControls({
  onPrevious,
  onNext,
  disabled = false,
  className = "",
}: CarouselControlsProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 backdrop-blur-sm border-white/20 rounded-full z-20 shadow-lg w-8 h-8 sm:w-10 sm:h-10 hidden sm:flex transition-all duration-200 bg-black/40 hover:bg-black/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50 pointer-events-auto"
        onClick={onPrevious}
        disabled={disabled}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 backdrop-blur-sm border-white/20 rounded-full z-20 shadow-lg w-8 h-8 sm:w-10 sm:h-10 hidden sm:flex transition-all duration-200 bg-black/40 hover:bg-black/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50 pointer-events-auto"
        onClick={onNext}
        disabled={disabled}
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
      </Button>
    </div>
  );
});

export default CarouselControls;
