import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
} as const;

export default function RatingStars({
  rating,
  count,
  size = "md",
}: RatingStarsProps) {
  const iconSize = sizeStyles[size];

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => {
          const starIndex = i + 1;
          const isFull = rating >= starIndex;
          const isHalf = !isFull && rating >= starIndex - 0.5;

          return (
            <span key={i} className="relative">
              {/* Background empty star */}
              <Star className={cn(iconSize, "text-gray-300")} />
              {/* Filled overlay */}
              {(isFull || isHalf) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isFull ? "100%" : "50%" }}
                >
                  <Star
                    className={cn(iconSize, "text-amber-400 fill-amber-400")}
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {typeof count === "number" && (
        <span
          className={cn(
            "text-gray-500",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
