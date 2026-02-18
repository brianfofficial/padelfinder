"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MapView as MapViewType } from "./MapView";

const MapView = dynamic(
  () => import("./MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
    ),
  }
);

export default function MapViewLazy(
  props: ComponentProps<typeof MapViewType>
) {
  return <MapView {...props} />;
}
