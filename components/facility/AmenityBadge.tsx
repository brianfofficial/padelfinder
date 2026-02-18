import {
  Warehouse,
  Sun,
  GlassWater,
  Lightbulb,
  ShoppingBag,
  PackageCheck,
  GraduationCap,
  Trophy,
  Users,
  UserPlus,
  DoorOpen,
  ParkingCircle,
  Coffee,
  Accessibility,
  Baby,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AMENITY_CONFIG, type AmenityKey } from "@/lib/utils/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  Warehouse,
  Sun,
  GlassWater,
  Lightbulb,
  ShoppingBag,
  PackageCheck,
  GraduationCap,
  Trophy,
  Users,
  UserPlus,
  DoorOpen,
  ParkingCircle,
  Coffee,
  Accessibility,
  Baby,
};

interface AmenityBadgeProps {
  amenity: AmenityKey;
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: {
    badge: "px-2 py-1 text-xs gap-1",
    icon: "h-3 w-3",
  },
  md: {
    badge: "px-3 py-1.5 text-sm gap-1.5",
    icon: "h-4 w-4",
  },
} as const;

export default function AmenityBadge({
  amenity,
  size = "md",
}: AmenityBadgeProps) {
  const config = AMENITY_CONFIG[amenity];
  const Icon = ICON_MAP[config.icon];
  const styles = sizeStyles[size];

  if (!Icon) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-gray-200 bg-gray-50 font-medium text-gray-700",
        styles.badge,
      )}
    >
      <Icon className={cn(styles.icon, "shrink-0")} />
      <span>{config.label}</span>
    </span>
  );
}
