import { Metadata } from "next";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";

export function homeMetadata(): Metadata {
  const title = `${SITE_NAME} — Find Padel Courts Near You`;
  const description =
    "Find padel courts near you. The most comprehensive directory of padel facilities in the United States with reviews, amenities, and court details.";

  return {
    title,
    description,
    alternates: {
      canonical: BASE_URL,
    },
    openGraph: {
      title,
      description,
      url: BASE_URL,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function stateMetadata(state: {
  name: string;
  slug: string;
  facility_count: number;
  meta_title?: string | null;
  meta_description?: string | null;
}): Metadata {
  const title =
    state.meta_title ||
    `Padel Courts in ${state.name} | ${SITE_NAME}`;
  const description =
    state.meta_description ||
    `Find ${state.facility_count} padel ${state.facility_count === 1 ? "court" : "courts"} in ${state.name}. Compare amenities, pricing, and book your next game. Indoor & outdoor courts available.`;
  const url = `${BASE_URL}/states/${state.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function cityMetadata(city: {
  name: string;
  slug: string;
  state_name: string;
  state_slug: string;
  state_abbr: string;
  facility_count: number;
  meta_title?: string | null;
  meta_description?: string | null;
}): Metadata {
  const title =
    city.meta_title ||
    `Padel Courts in ${city.name}, ${city.state_abbr} | ${SITE_NAME}`;
  const description =
    city.meta_description ||
    `Discover ${city.facility_count} padel ${city.facility_count === 1 ? "court" : "courts"} in ${city.name}, ${city.state_name}. Compare pricing, read reviews, and book online.`;
  const url = `${BASE_URL}/states/${city.state_slug}/${city.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function facilityMetadata(facility: {
  name: string;
  slug: string;
  city: string;
  state: string;
  state_abbr: string;
  total_courts?: number;
  indoor_courts?: boolean;
  outdoor_courts?: boolean;
  price_per_hour_cents?: number | null;
  equipment_rental?: boolean;
  coaching?: boolean;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  images?: string[];
}): Metadata {
  const title =
    facility.meta_title ||
    `${facility.name} — Padel in ${facility.city}, ${facility.state_abbr} | ${SITE_NAME}`;

  let autoDescription = `${facility.name}`;
  if (facility.total_courts) autoDescription += ` offers ${facility.total_courts} padel ${facility.total_courts === 1 ? "court" : "courts"}`;
  autoDescription += ` in ${facility.city}, ${facility.state_abbr}.`;
  if (facility.indoor_courts && facility.outdoor_courts) autoDescription += " Indoor & outdoor.";
  else if (facility.indoor_courts) autoDescription += " Indoor courts.";
  else if (facility.outdoor_courts) autoDescription += " Outdoor courts.";
  if (facility.price_per_hour_cents) autoDescription += ` From $${(facility.price_per_hour_cents / 100).toFixed(0)}/hr.`;
  const extras = [facility.equipment_rental && "Equipment rental", facility.coaching && "coaching"].filter(Boolean);
  if (extras.length > 0) autoDescription += ` ${extras.join(", ")} & more.`;

  const description =
    facility.meta_description ||
    facility.description ||
    autoDescription;
  const url = `${BASE_URL}/courts/${facility.slug}`;

  const images =
    facility.images && facility.images.length > 0
      ? facility.images.map((src) => ({ url: src }))
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function blogMetadata(post: {
  title: string;
  slug: string;
  description: string;
  publishedAt?: string;
}): Metadata {
  const title = `${post.title} | ${SITE_NAME}`;
  const url = `${BASE_URL}/blog/${post.slug}`;

  return {
    title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: post.description,
      url,
      siteName: SITE_NAME,
      type: "article",
      ...(post.publishedAt
        ? { publishedTime: post.publishedAt }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
    },
  };
}
