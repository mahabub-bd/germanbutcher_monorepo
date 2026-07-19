import { GermanbutcherLogo } from "@/public/images";
import Image from "next/image";

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
  iconSize?: number;
  containerClassName?: string;
  fullHeight?: boolean;
}

export function LoadingIndicator({
  message = "Loading...",
  className = "",
  fullHeight = false,

  containerClassName = "py-12",
}: LoadingIndicatorProps) {
  return (
    <div
      className={`flex justify-center items-center ${
        fullHeight ? "min-h-screen" : "min-h-1/2"
      } ${containerClassName}`}
    >
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <Image src={GermanbutcherLogo} alt="logo" width={40} height={40} />

        {/* Loading Message */}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
