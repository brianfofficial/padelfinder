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
  Navigation,
  Flag,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import PhotoGallery from "@/components/facility/PhotoGallery";
import RatingStars from "@/components/facility/RatingStars";
import AmenityGrid from "@/components/facility/AmenityGrid";
import HoursTable from "@/components/facility/HoursTable";
import NearbyFacilities from "@/components/facility/NearbyFacilities";
import MapViewLazy from "@/components/map/MapViewLazy";
import ReviewsSection from "@/components/facility/ReviewsSection";
import ReviewInsights from "@/components/facility/ReviewInsights";
import ShareButton from "@/components/facility/ShareButton";
import FAQSection from "@/components/ui/FAQSection";
import StatsBar from "@/components/ui/StatsBar";
import Badge from "@/components/ui/Badge";
import JsonLd from "@/components/seo/JsonLd";
import {
  getFacilityBySlug,
  getAllFacilitySlugs,
  getNearbyFacilities,
} from "@/lib/queries/facilities";
import { getReviewsByFacility, getReviewStats } from "@/lib/queries/reviews";
import { getCityBySlug } from "@/lib/queries/cities";
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

  const [reviews, reviewStats, nearbyFacilities, cityData] = await Promise.all([
    getReviewsByFacility(facility.id),
    getReviewStats(facility.id),
    getNearbyFacilities(facility.latitude, facility.longitude, 25, 4),
    getCityBySlug(facility.city_slug, facility.state_slug),
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
        data={facilitySchema(facility, reviews) as unknown as Record<string, unknown>}
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

              {facility.google_rating && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-sm shadow-sm">
                  <span className="font-semibold text-gray-900">
                    {Number(facility.google_rating).toFixed(1)}
                  </span>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-gray-500">
                    {facility.google_review_count > 0
                      ? `(${facility.google_review_count} on Google)`
                      : "on Google"}
                  </span>
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
              <MapViewLazy
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

            {/* AI Review Insights */}
            {facility.review_summary && (
              <ReviewInsights
                summary={facility.review_summary}
                pros={facility.review_pros}
                cons={facility.review_cons}
                bestForTags={facility.best_for_tags}
                standoutQuote={facility.standout_quote}
                ownerResponseRate={facility.owner_response_rate}
              />
            )}

            {/* Reviews */}
            <ReviewsSection
              reviews={reviews}
              stats={reviewStats}
              googlePlaceId={facility.google_place_id}
              facilityName={facility.name}
            />

            {/* FAQ */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
              <FAQSection
                items={[
                  ...(facility.price_per_hour_cents
                    ? [{
                        question: `How much does it cost to play at ${facility.name}?`,
                        answer: `Court rental at ${facility.name} starts at $${(facility.price_per_hour_cents / 100).toFixed(0)} per hour${facility.price_peak_cents ? `, with peak hours at $${(facility.price_peak_cents / 100).toFixed(0)} per hour` : ""}. ${facility.membership_available ? "Memberships are also available for regular players." : ""}`,
                      }]
                    : []),
                  {
                    question: `How many padel courts does ${facility.name} have?`,
                    answer: `${facility.name} has ${facility.total_courts} padel ${facility.total_courts === 1 ? "court" : "courts"}${facility.indoor_court_count > 0 ? ` (${facility.indoor_court_count} indoor` : ""}${facility.outdoor_court_count > 0 ? `${facility.indoor_court_count > 0 ? ", " : " ("}${facility.outdoor_court_count} outdoor` : ""}${facility.indoor_court_count > 0 || facility.outdoor_court_count > 0 ? ")" : ""}.`,
                  },
                  ...(facility.review_count > 0
                    ? [{
                        question: `What do players say about ${facility.name}?`,
                        answer: facility.review_summary
                          ? facility.review_summary
                          : `${facility.name} has ${facility.review_count} ${facility.review_count === 1 ? "review" : "reviews"} with an average rating of ${Number(facility.avg_rating).toFixed(1)} out of 5 stars.`,
                      }]
                    : []),
                  ...(facility.best_for_tags && facility.best_for_tags.length > 0
                    ? [{
                        question: `Who is ${facility.name} best for?`,
                        answer: `Based on player reviews, ${facility.name} is best suited for ${facility.best_for_tags.join(", ").replace(/, ([^,]*)$/, ", and $1")}.`,
                      }]
                    : []),
                ]}
              />
            </section>

            {/* Claim Listing CTA */}
            <section className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Own or manage {facility.name}?
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Claim this listing to update your info, respond to reviews, and reach more players.
              </p>
              <a
                href={`mailto:brian@padelfinder.com?subject=Claim listing: ${encodeURIComponent(facility.name)}&body=I'd like to claim the listing for ${encodeURIComponent(facility.name)} on PadelFinder.%0A%0AMy name:%0AMy role:%0AFacility website:`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-padel-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-padel-700"
              >
                <ShieldCheck className="h-4 w-4" />
                Claim This Listing
              </a>
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

            {/* City Guide Card */}
            {cityData?.guide_intro && (
              <Link
                href={`/guides/cities/${facility.state_slug}/${facility.city_slug}`}
                className="group block rounded-xl border border-padel-200 bg-padel-50 p-4 transition-colors hover:bg-padel-100"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-padel-700">
                  <BookOpen className="h-4 w-4" />
                  {facility.city} Padel Guide
                </div>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {cityData.guide_intro}
                </p>
              </Link>
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
