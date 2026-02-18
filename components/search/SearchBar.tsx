"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, Map, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchResult {
  type: "facility" | "city" | "state";
  name: string;
  slug: string;
  extra?: string;
  url: string;
}

interface SearchBarProps {
  size?: "sm" | "lg";
  className?: string;
  placeholder?: string;
}

export function SearchBar({
  size = "sm",
  className,
  placeholder = "Search courts, cities, or states...",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: SearchResult[] = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(results[activeIndex].url);
        setIsOpen(false);
        setQuery("");
      } else if (query.length >= 2) {
        router.push(`/courts?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  const iconForType = (type: string) => {
    switch (type) {
      case "facility":
        return <Building2 className="h-4 w-4 text-gray-400" />;
      case "city":
        return <MapPin className="h-4 w-4 text-gray-400" />;
      case "state":
        return <Map className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
            size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none",
            size === "lg" ? "py-3.5 text-base" : "py-2 text-sm"
          )}
          aria-label="Search"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading && (
          <Loader2
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400",
              size === "lg" ? "h-5 w-5" : "h-4 w-4"
            )}
          />
        )}
      </div>

      {isOpen && (
        <ul
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {results.map((result, i) => (
            <li key={`${result.type}-${result.slug}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                  i === activeIndex ? "bg-navy-50" : "hover:bg-gray-50"
                )}
                onClick={() => {
                  router.push(result.url);
                  setIsOpen(false);
                  setQuery("");
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {iconForType(result.type)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{result.name}</p>
                  {result.extra && (
                    <p className="text-xs text-gray-500">{result.extra}</p>
                  )}
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500">
                  {result.type}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
