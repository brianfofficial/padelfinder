import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-padel-100 text-padel-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-navy-100 text-navy-800",
  featured: "bg-gradient-to-r from-amber-400 to-amber-500 text-white",
} as const;

interface BadgeProps {
  variant?: keyof typeof variantStyles;
  className?: string;
  children: ReactNode;
}

export default function Badge({
  variant = "default",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
