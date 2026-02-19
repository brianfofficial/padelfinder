import type {
  WithContext,
  WebSite,
  Organization,
  SportsActivityLocation,
  CollectionPage,
  Article,
  BreadcrumbList,
} from "schema-dts";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";
import type { Facility, Review, WeeklyHours, DayHours } from "@/lib/types/facility";

export function websiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/courts?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    } as WebSite["potentialAction"],
  };
}

export function organizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [],
    description:
      "The most comprehensive directory of padel facilities in the United States.",
  };
}

/** Map day name to schema.org DayOfWeek value */
const DAY_MAP: Record<string, string> = {
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
};

function buildOpeningHours(hours: WeeklyHours) {
  const specs: object[] = [];

  for (const [day, schedule] of Object.entries(hours)) {
    const dayHours = schedule as DayHours | undefined;
    if (!dayHours || dayHours.closed) continue;
    const dayOfWeek = DAY_MAP[day];
    if (!dayOfWeek) continue;

    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayOfWeek,
      opens: dayHours.open,
      closes: dayHours.close,
    });
  }

  return specs;
}

export function facilitySchema(
  facility: Facility,
  reviews?: Review[],
): WithContext<SportsActivityLocation> {
  const url = `${BASE_URL}/courts/${facility.state_slug}/${facility.city_slug}/${facility.slug}`;

  // Build the base schema object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: facility.name,
    url,
    description: facility.description ?? undefined,
    telephone: facility.phone ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: facility.address,
      addressLocality: facility.city,
      addressRegion: facility.state_abbr,
      postalCode: facility.zip_code,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: facility.latitude,
      longitude: facility.longitude,
    },
    image: facility.images.length > 0 ? facility.images : undefined,
  };

  // Add aggregate rating — prefer Google rating when available
  const ratingValue = facility.google_rating ?? facility.avg_rating;
  const reviewCount = facility.google_review_count || facility.review_count;
  if (reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add individual Review entries (top 5 with text)
  if (reviews && reviews.length > 0) {
    const topReviews = reviews
      .filter((r) => r.text || r.comment)
      .slice(0, 5);
    if (topReviews.length > 0) {
      schema.review = topReviews.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author_name },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.text ?? r.comment,
        datePublished: r.published_at ?? r.created_at,
      }));
    }
  }

  // Add opening hours if available
  if (facility.hours) {
    const specs = buildOpeningHours(facility.hours);
    if (specs.length > 0) {
      schema.openingHoursSpecification = specs;
    }
  }

  // Add price range if available
  if (facility.price_per_hour_cents) {
    schema.priceRange =
      `$${(facility.price_per_hour_cents / 100).toFixed(0)}/hr`;
  }

  return schema as WithContext<SportsActivityLocation>;
}

export function collectionPageSchema(
  title: string,
  description: string,
  url: string
): WithContext<CollectionPage> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

export function articleSchema(post: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
}): WithContext<Article> {
  const url = `${BASE_URL}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    url,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt ?? post.publishedAt,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
