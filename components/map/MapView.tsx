"use client";

import { useState, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import Link from "next/link";
import type { Facility } from "@/lib/types/facility";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  facilities: Pick<Facility, "id" | "slug" | "name" | "latitude" | "longitude" | "city" | "state_abbr" | "avg_rating" | "total_courts">[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

export function MapView({
  facilities,
  center,
  zoom = 10,
  className,
}: MapViewProps) {
  const [selected, setSelected] = useState<(typeof facilities)[number] | null>(null);

  const defaultCenter = center || {
    lat: facilities[0]?.latitude || 39.8283,
    lng: facilities[0]?.longitude || -98.5795,
  };

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleMarkerClick = useCallback(
    (facility: (typeof facilities)[number]) => {
      setSelected(facility);
    },
    []
  );

  if (!token) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 ${className}`}>
        <div className="text-center text-sm text-gray-500">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p>Map requires Mapbox token</p>
          <p className="text-xs">Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      <Map
        initialViewState={{
          latitude: defaultCenter.lat,
          longitude: defaultCenter.lng,
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={token}
      >
        <NavigationControl position="top-right" />

        {facilities.map((f) => (
          <Marker
            key={f.id}
            latitude={f.latitude}
            longitude={f.longitude}
            anchor="bottom"
            onClick={(e: { originalEvent: MouseEvent }) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(f);
            }}
          >
            <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-navy-700 text-white shadow-md transition-transform hover:scale-110">
              <MapPin className="h-4 w-4" />
            </div>
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            anchor="bottom"
            offset={30}
            onClose={() => setSelected(null)}
            closeOnClick={false}
          >
            <Link href={`/courts/${selected.slug}`} className="block p-1">
              <p className="font-medium text-gray-900">{selected.name}</p>
              <p className="text-xs text-gray-500">
                {selected.city}, {selected.state_abbr}
              </p>
              <p className="mt-1 text-xs text-navy-600">
                {selected.total_courts} courts
                {selected.avg_rating > 0 && ` · ${selected.avg_rating.toFixed(1)}★`}
              </p>
            </Link>
          </Popup>
        )}
      </Map>
    </div>
  );
}
