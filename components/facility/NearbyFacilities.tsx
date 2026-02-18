import type { Facility } from "@/lib/types/facility";
import FacilityCard from "@/components/facility/FacilityCard";

interface NearbyFacilitiesProps {
  facilities: Facility[];
}

export default function NearbyFacilities({
  facilities,
}: NearbyFacilitiesProps) {
  const displayed = facilities.slice(0, 4);

  if (displayed.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900">Nearby Courts</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {displayed.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            variant="compact"
          />
        ))}
      </div>
    </section>
  );
}
