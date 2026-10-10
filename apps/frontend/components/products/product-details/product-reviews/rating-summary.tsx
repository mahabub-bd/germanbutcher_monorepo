import type { RatingSummary as RatingSummaryType } from "@/utils/types";
import { Stars } from "./stars";

interface RatingSummaryProps {
  summary: RatingSummaryType;
}

/** Average rating + per-star breakdown bars for the product reviews section. */
export function RatingSummary({ summary }: RatingSummaryProps) {
  const { averageRating, reviewCount, breakdown } = summary;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-0 rounded-xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
      {/* Average */}
      <div className="flex flex-col items-center text-center md:w-52 md:shrink-0 md:md:border-r md:border-gray-100">
        <span className="text-5xl font-bold leading-none text-primaryColor">
          {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
        </span>
        <Stars
          rating={averageRating}
          className="mt-2"
          starClassName="h-5 w-5"
        />
        <span className="mt-2 text-sm text-muted-foreground">
          Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Breakdown bars */}
      <div className="w-full max-w-sm space-y-2 md:pl-8">
        {(["5", "4", "3", "2", "1"] as const).map((star) => {
          const count = breakdown[star] ?? 0;
          const percent =
            reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-10 text-right font-medium text-gray-600">
                {star} star
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-6 tabular-nums text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
