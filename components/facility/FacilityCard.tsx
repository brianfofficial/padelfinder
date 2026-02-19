import Link from "next/link";
import Image from "next/image";
import { MapPin, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Facility } from "@/lib/types/facility";
import { getActiveAmenities } from "@/lib/types/facility";
import Badge from "@/components/ui/Badge";
import RatingStars from "@/components/facility/RatingStars";
import AmenityBadge from "@/components/facility/AmenityBadge";

interface FacilityCardProps {
  facility: Facility;
  variant?: "default" | "compact" | "featured";
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function FacilityCard({
  facility,
  variant = "default",
}: FacilityCardProps) {
  const isFeatured = variant === "featured" || facility.is_featured;
  const isCompact = variant === "compact";
  const amenities = getActiveAmenities(facility).slice(0, 4);
  const hasImage = facility.images.length > 0;

  return (
    <Link
      href={`/courts/${facility.slug}`}
      className={cn(
        "group block rounded-xl border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md",
        isFeatured
          ? "border-amber-400 ring-1 ring-amber-400/50"
          : "border-gray-200",
        isCompact && "flex flex-row",
      )}
    >
      {/* Image area */}
      <div
        className={cn(
          "relative overflow-hidden",
          isCompact ? "h-full w-32 shrink-0" : "aspect-[16/10] w-full",
        )}
      >
        {hasImage ? (
          <Image
            src={facility.images[0]}
            alt={facility.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={isCompact ? "128px" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-100 to-padel-100 flex items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-3/4 h-3/4 opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Padel court outline */}
              <rect x="20" y="10" width="160" height="100" rx="4" stroke="currentColor" strokeWidth="2" className="text-navy-400" />
              {/* Glass walls */}
              <line x1="20" y1="10" x2="20" y2="110" stroke="currentColor" strokeWidth="3" className="text-navy-500" />
              <line x1="180" y1="10" x2="180" y2="110" stroke="currentColor" strokeWidth="3" className="text-navy-500" />
              {/* Center line */}
              <line x1="100" y1="10" x2="100" y2="110" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="text-navy-400" />
              {/* Service boxes */}
              <line x1="20" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="1" className="text-navy-300" />
              <line x1="100" y1="40" x2="180" y2="40" stroke="currentColor" strokeWidth="1" className="text-navy-300" />
              <line x1="20" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="1" className="text-navy-300" />
              <line x1="100" y1="80" x2="180" y2="80" stroke="currentColor" strokeWidth="1" className="text-navy-300" />
            </svg>
            <span className="absolute text-3xl font-bold text-navy-300/50 font-display">
              {facility.name.charAt(0)}
            </span>
          </div>
        )}
        {isFeatured && (
          <div className="absolute top-2 left-2">
            <Badge variant="featured">Featured</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex flex-1 flex-col p-4", isCompact && "py-3")}>
        <h3
          className={cn(
            "font-semibold text-gray-900 group-hover:text-navy-700 transition-colors line-clamp-1",
            isCompact ? "text-sm" : "text-base",
          )}
        >
          {facility.name}
          {facility.verification_status === "verified" && (
            <CheckCircle className="ml-1 inline h-4 w-4 text-padel-600" />
          )}
        </h3>

        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">
            {facility.city}, {facility.state_abbr}
          </span>
        </div>

        {!isCompact && (
          <>
            {facility.avg_rating > 0 && (
              <div className="mt-2">
                <RatingStars
                  rating={facility.avg_rating}
                  count={facility.review_count}
                  size="sm"
                />
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <Badge variant="info">
                {facility.total_courts} {facility.total_courts === 1 ? "court" : "courts"}
              </Badge>
              {facility.price_per_hour_cents && (
                <span className="text-sm font-medium text-gray-700">
                  From {formatPrice(facility.price_per_hour_cents)}/hr
                </span>
              )}
            </div>

            {amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {amenities.map((amenity) => (
                  <AmenityBadge key={amenity} amenity={amenity} size="sm" />
                ))}
              </div>
            )}
          </>
        )}

        {isCompact && facility.total_courts > 0 && (
          <div className="mt-1.5">
            <Badge variant="info">
              {facility.total_courts} {facility.total_courts === 1 ? "court" : "courts"}
            </Badge>
          </div>
        )}
      </div>
    </Link>
  );
}
