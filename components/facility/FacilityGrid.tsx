import { cn } from "@/lib/utils/cn";
import type { Facility } from "@/lib/types/facility";
import FacilityCard from "@/components/facility/FacilityCard";

interface FacilityGridProps {
  facilities: Facility[];
  variant?: "default" | "compact";
  className?: string;
}

export default function FacilityGrid({
  facilities,
  variant = "default",
  className,
}: FacilityGridProps) {
  if (facilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
        <p className="text-lg font-medium text-gray-700">No facilities found</p>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-6",
        variant === "compact"
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {facilities.map((facility) => (
        <FacilityCard
          key={facility.id}
          facility={facility}
          variant={variant}
        />
      ))}
    </div>
  );
}
