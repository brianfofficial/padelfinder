export const SITE_NAME = "PadelFinder";
export const SITE_DESCRIPTION =
  "Find padel courts near you. The most comprehensive directory of padel facilities in the United States.";
export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://padelfinder.com";

export const ITEMS_PER_PAGE = 24;

export const AMENITY_CONFIG = {
  indoor_courts: { label: "Indoor Courts", icon: "Warehouse" },
  outdoor_courts: { label: "Outdoor Courts", icon: "Sun" },
  panoramic_glass: { label: "Panoramic Glass", icon: "GlassWater" },
  led_lighting: { label: "LED Lighting", icon: "Lightbulb" },
  pro_shop: { label: "Pro Shop", icon: "ShoppingBag" },
  equipment_rental: { label: "Equipment Rental", icon: "PackageCheck" },
  coaching: { label: "Coaching", icon: "GraduationCap" },
  tournaments: { label: "Tournaments", icon: "Trophy" },
  leagues: { label: "Leagues", icon: "Users" },
  open_play: { label: "Open Play", icon: "UserPlus" },
  locker_rooms: { label: "Locker Rooms", icon: "DoorOpen" },
  parking: { label: "Parking", icon: "ParkingCircle" },
  food_beverage: { label: "Food & Beverage", icon: "Coffee" },
  wheelchair_accessible: { label: "Wheelchair Accessible", icon: "Accessibility" },
  kids_programs: { label: "Kids Programs", icon: "Baby" },
} as const;

export type AmenityKey = keyof typeof AMENITY_CONFIG;
