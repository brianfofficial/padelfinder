import type { AmenityKey } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import AmenityBadge from "@/components/facility/AmenityBadge";

interface AmenityGridProps {
  amenities: AmenityKey[];
  className?: string;
}

export default function AmenityGrid({ amenities, className }: AmenityGridProps) {
  if (amenities.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {amenities.map((amenity) => (
        <AmenityBadge key={amenity} amenity={amenity} />
      ))}
    </div>
  );
}
