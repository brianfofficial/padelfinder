import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Clock,
  DollarSign,
  Star,
  User,
  Navigation,
  Share2,
  Flag,
  ShieldCheck,
} from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import PhotoGallery from "@/components/facility/PhotoGallery";
import RatingStars from "@/components/facility/RatingStars";
import AmenityGrid from "@/components/facility/AmenityGrid";
import HoursTable from "@/components/facility/HoursTable";
import NearbyFacilities from "@/components/facility/NearbyFacilities";
import { MapView } from "@/components/map/MapView";
import ShareButton from "@/components/facility/ShareButton";
import StatsBar from "@/components/ui/StatsBar";
import Badge from "@/components/ui/Badge";
import JsonLd from "@/components/seo/JsonLd";
import {
  getFacilityBySlug,
  getAllFacilitySlugs,
  getNearbyFacilities,
} from "@/lib/queries/facilities";
import { getReviewsByFacility } from "@/lib/queries/reviews";
import { facilityMetadata } from "@/lib/seo/metadata";
import {
  facilitySchema,
  breadcrumbSchema,
} from "@/lib/seo/schemas";
import { BASE_URL } from "@/lib/utils/constants";
import { formatPrice, formatPhone, pluralize } from "@/lib/utils/format";
import { getActiveAmenities } from "@/lib/types/facility";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ "court-slug": string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllFacilitySlugs();
  return slugs.map((s) => ({ "court-slug": s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "court-slug": courtSlug } = await params;
  const facility = await getFacilityBySlug(courtSlug);
  if (!facility) return {};
  return facilityMetadata(facility);
}

export default async function FacilityDetailPage({ params }: PageProps) {
  const { "court-slug": courtSlug } = await params;

  const facility = await getFacilityBySlug(courtSlug);
  if (!facility) notFound();

  const [reviews, nearbyFacilities] = await Promise.all([
    getReviewsByFacility(facility.id),
    getNearbyFacilities(facility.latitude, facility.longitude, 25, 4),
  ]);

  // Filter out the current facility from nearby results
  const nearby = nearbyFacilities.filter((f) => f.id !== facility.id);

  const amenities = getActiveAmenities(facility);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "States", href: "/states" },
    { label: facility.state, href: `/states/${facility.state_slug}` },
    {
      label: facility.city,
      href: `/states/${facility.state_slug}/${facility.city_slug}`,
    },
    {
      label: facility.name,
      href: `/courts/${facility.slug}`,
    },
  ];

  return (
    <>
      <JsonLd
        data={facilitySchema(facility) as unknown as Record<string, unknown>}
      />
      <JsonLd
        data={
          breadcrumbSchema(
            breadcrumbs.map((b) => ({
              name: b.label,
              url: `${BASE_URL}${b.href}`,
            })),
          ) as unknown as Record<string, unknown>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <BreadcrumbNav items={breadcrumbs} />

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Gallery */}
            <PhotoGallery images={facility.images} name={facility.name} />

            {/* Title & Rating */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-extrabold text-gray-900 md:text-3xl">
                  {facility.name}
                </h1>
                {facility.is_featured && (
                  <Badge variant="featured">Featured</Badge>
                )}
              </div>

              {facility.avg_rating > 0 && (
                <div className="mt-2">
                  <RatingStars
                    rating={facility.avg_rating}
                    count={facility.review_count}
                    size="md"
                  />
                </div>
              )}

              {/* Address */}
              <div className="mt-3 flex items-start gap-2 text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  {facility.address}, {facility.city}, {facility.state_abbr}{" "}
                  {facility.zip_code}
                </span>
              </div>
            </div>

            {/* Court Stats */}
            <StatsBar
              stats={[
                {
                  label: "Total Courts",
                  value: facility.total_courts,
                },
                {
                  label: "Indoor",
                  value: facility.indoor_court_count,
                },
                {
                  label: "Outdoor",
                  value: facility.outdoor_court_count,
                },
              ]}
              className="rounded-xl border border-gray-200 bg-white"
            />

            {/* Amenities */}
            {amenities.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Amenities
                </h2>
                <AmenityGrid amenities={amenities} />
              </section>
            )}

            {/* Description */}
            {facility.description && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-gray-900">
                  About {facility.name}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {facility.description}
                </p>
              </section>
            )}

            {/* Map */}
            <section>
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                Location
              </h2>
              <MapView
                facilities={[facility]}
                center={{ lat: facility.latitude, lng: facility.longitude }}
                zoom={14}
                className="h-64"
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </a>
                <ShareButton name={facility.name} />
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Reviews{" "}
                {reviews.length > 0 && (
                  <span className="text-base font-normal text-gray-500">
                    ({reviews.length})
                  </span>
                )}
              </h2>
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                  <Star className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    No reviews yet. Be the first to leave a review!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-gray-200 bg-white p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-navy-700">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.author_name}
                            </p>
                            {review.skill_level && (
                              <p className="text-xs text-gray-500 capitalize">
                                {review.skill_level} player
                              </p>
                            )}
                          </div>
                        </div>
                        <RatingStars rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-1">
            {/* Book Now CTA */}
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-padel-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-padel-700"
              >
                Book Now
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            {/* Contact Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Contact Information
              </h2>
              <div className="space-y-3">
                {/* Address */}
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span className="text-gray-600">
                    {facility.address}
                    <br />
                    {facility.city}, {facility.state_abbr} {facility.zip_code}
                  </span>
                </div>

                {/* Phone */}
                {facility.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    <a
                      href={`tel:${facility.phone}`}
                      className="text-navy-700 hover:text-navy-900 transition-colors"
                    >
                      {formatPhone(facility.phone)}
                    </a>
                  </div>
                )}

                {/* Email */}
                {facility.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <a
                      href={`mailto:${facility.email}`}
                      className="text-navy-700 hover:text-navy-900 transition-colors"
                    >
                      {facility.email}
                    </a>
                  </div>
                )}

                {/* Website */}
                {facility.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                    <a
                      href={facility.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-navy-700 hover:text-navy-900 transition-colors"
                    >
                      Visit website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            {(facility.price_per_hour_cents || facility.membership_available) && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                  <DollarSign className="h-5 w-5 text-padel-600" />
                  Pricing
                </h2>
                <div className="space-y-2">
                  {facility.price_per_hour_cents && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Court Rental</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(facility.price_per_hour_cents)}/hr
                      </span>
                    </div>
                  )}
                  {facility.price_peak_cents && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Peak Hours</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(facility.price_peak_cents)}/hr
                      </span>
                    </div>
                  )}
                  {facility.membership_available && (
                    <div className="mt-2">
                      <Badge variant="success">Memberships Available</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hours Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                <Clock className="h-5 w-5 text-navy-600" />
                Hours
              </h2>
              <HoursTable hours={facility.hours} />
            </div>

            {/* Surface Type */}
            {facility.surface_type && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-lg font-bold text-gray-900">
                  Court Surface
                </h2>
                <p className="text-sm capitalize text-gray-600">
                  {facility.surface_type}
                </p>
              </div>
            )}

            {/* Listing Actions */}
            <div className="space-y-2 text-sm">
              <a
                href={`mailto:hello@padelfinder.com?subject=${encodeURIComponent(`Claim: ${facility.name}`)}`}
                className="flex items-center gap-2 text-gray-500 hover:text-navy-700 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Claim This Listing
              </a>
              <a
                href={`mailto:hello@padelfinder.com?subject=${encodeURIComponent(`Report: ${facility.name}`)}`}
                className="flex items-center gap-2 text-gray-500 hover:text-navy-700 transition-colors"
              >
                <Flag className="h-4 w-4" />
                Report Incorrect Info
              </a>
            </div>
          </aside>
        </div>

        {/* Nearby Facilities */}
        {nearby.length > 0 && (
          <section className="mt-12">
            <NearbyFacilities facilities={nearby} />
          </section>
        )}
      </div>
    </>
  );
}
