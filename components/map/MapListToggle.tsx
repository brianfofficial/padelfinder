"use client";

import { useState } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MapListToggleProps {
  onToggle: (view: "list" | "map") => void;
  defaultView?: "list" | "map";
}

export function MapListToggle({ onToggle, defaultView = "list" }: MapListToggleProps) {
  const [view, setView] = useState(defaultView);

  function toggle(next: "list" | "map") {
    setView(next);
    onToggle(next);
  }

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => toggle("list")}
        className={cn(
          "flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors",
          view === "list" ? "bg-navy-700 text-white" : "text-gray-600 hover:bg-gray-50"
        )}
      >
        <List className="h-4 w-4" />
        List
      </button>
      <button
        type="button"
        onClick={() => toggle("map")}
        className={cn(
          "flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-sm font-medium transition-colors",
          view === "map" ? "bg-navy-700 text-white" : "text-gray-600 hover:bg-gray-50"
        )}
      >
        <MapIcon className="h-4 w-4" />
        Map
      </button>
    </div>
  );
}
