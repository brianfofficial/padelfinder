"use client";

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import Link from "next/link";
import type { Facility } from "@/lib/types/facility";

interface MapViewProps {
  facilities: Pick<
    Facility,
    | "id"
    | "slug"
    | "name"
    | "latitude"
    | "longitude"
    | "city"
    | "state_abbr"
    | "avg_rating"
    | "total_courts"
  >[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

const padelIcon = new L.Icon({
  iconUrl: "/images/map-pin.svg",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export function MapView({
  facilities,
  center,
  zoom = 10,
  className,
}: MapViewProps) {
  const [selected, setSelected] = useState<
    (typeof facilities)[number] | null
  >(null);

  const defaultCenter: [number, number] = center
    ? [center.lat, center.lng]
    : facilities[0]
      ? [facilities[0].latitude, facilities[0].longitude]
      : [39.8283, -98.5795];

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 ${className ?? ""}`}
    >
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
        className="z-0"
      >
        <ChangeView center={defaultCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {facilities.map((f) => (
          <Marker
            key={f.id}
            position={[f.latitude, f.longitude]}
            icon={padelIcon}
            eventHandlers={{
              click: () => setSelected(f),
            }}
          />
        ))}

        {selected && (
          <Popup
            position={[selected.latitude, selected.longitude]}
            eventHandlers={{ remove: () => setSelected(null) }}
          >
            <Link
              href={`/courts/${selected.slug}`}
              className="block p-1 no-underline"
            >
              <p className="m-0 font-medium text-gray-900">{selected.name}</p>
              <p className="m-0 text-xs text-gray-500">
                {selected.city}, {selected.state_abbr}
              </p>
              <p className="m-0 mt-1 text-xs text-navy-600">
                {selected.total_courts} courts
                {selected.avg_rating > 0 &&
                  ` · ${selected.avg_rating.toFixed(1)}★`}
              </p>
            </Link>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
}
