import { Star } from "lucide-react";

interface StarsProps {
  rating: number;
  className?: string;
  starClassName?: string;
}

/** Static star row (1-5) shared by the summary, review list and cards. */
export function Stars({
  rating,
  className = "",
  starClassName = "h-4 w-4",
}: StarsProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${starClassName} ${
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
