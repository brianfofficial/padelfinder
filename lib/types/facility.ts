import type { AmenityKey } from "@/lib/utils/constants";

export interface Facility {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  // Location
  address: string;
  city: string;
  city_slug: string;
  state: string;
  state_slug: string;
  state_abbr: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  // Contact
  phone: string | null;
  email: string | null;
  website: string | null;
  // Court details
  total_courts: number;
  indoor_court_count: number;
  outdoor_court_count: number;
  surface_type: string | null;
  // Amenities (boolean flags)
  indoor_courts: boolean;
  outdoor_courts: boolean;
  panoramic_glass: boolean;
  led_lighting: boolean;
  pro_shop: boolean;
  equipment_rental: boolean;
  coaching: boolean;
  tournaments: boolean;
  leagues: boolean;
  open_play: boolean;
  locker_rooms: boolean;
  parking: boolean;
  food_beverage: boolean;
  wheelchair_accessible: boolean;
  kids_programs: boolean;
  // Pricing
  price_per_hour_cents: number | null;
  price_peak_cents: number | null;
  membership_available: boolean;
  // Hours & images (JSONB)
  hours: WeeklyHours | null;
  images: string[];
  // Ratings (materialized)
  avg_rating: number;
  review_count: number;
  // Google Places enrichment
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number;
  // Verification
  verified_at: string | null;
  verification_status: "unverified" | "verified" | "claimed";
  website_live: boolean | null;
  data_source: string;
  google_cid: string | null;
  rating_distribution: Record<string, number> | null;
  // AI review insights
  review_summary: string | null;
  review_pros: string[] | null;
  review_cons: string[] | null;
  best_for_tags: string[] | null;
  standout_quote: string | null;
  owner_response_rate: number | null;
  // SEO
  meta_title: string | null;
  meta_description: string | null;
  // Status
  status: "active" | "pending" | "inactive";
  is_featured: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface WeeklyHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

export interface State {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  latitude: number;
  longitude: number;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  facility_count: number;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  state_id: string;
  name: string;
  slug: string;
  state_slug: string;
  state_name: string;
  state_abbr: string;
  latitude: number;
  longitude: number;
  population: number | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  facility_count: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  facility_id: string;
  rating: number;
  author_name: string;
  comment: string | null;
  skill_level: "beginner" | "intermediate" | "advanced" | null;
  status: "pending" | "approved" | "rejected";
  // Google import fields
  source: "user" | "google";
  source_review_id: string | null;
  text: string | null;
  published_at: string | null;
  owner_response: string | null;
  owner_response_date: string | null;
  language: string;
  helpful_count: number;
  created_at: string;
}

export interface Submission {
  id: string;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  total_courts: number | null;
  description: string | null;
  submitter_name: string;
  submitter_email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export type FacilityAmenities = Pick<Facility, AmenityKey>;

export function getActiveAmenities(facility: FacilityAmenities): AmenityKey[] {
  const amenityKeys: AmenityKey[] = [
    "indoor_courts", "outdoor_courts", "panoramic_glass", "led_lighting",
    "pro_shop", "equipment_rental", "coaching", "tournaments", "leagues",
    "open_play", "locker_rooms", "parking", "food_beverage",
    "wheelchair_accessible", "kids_programs",
  ];
  return amenityKeys.filter((key) => facility[key]);
}
