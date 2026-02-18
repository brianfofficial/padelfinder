"use client";

interface AdSlotProps {
  slot: string;
  format?: "horizontal" | "vertical" | "rectangle";
  className?: string;
}

export function AdSlot({ slot, format = "horizontal", className }: AdSlotProps) {
  // Placeholder — replace with actual AdSense code when ready
  return (
    <div
      className={className}
      data-ad-slot={slot}
      data-ad-format={format}
      aria-hidden="true"
    />
  );
}
