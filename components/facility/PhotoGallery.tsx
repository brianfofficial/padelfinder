"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PhotoGalleryProps {
  images: string[];
  name: string;
}

export default function PhotoGallery({ images, name }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  }, []);

  // Filter out failed images
  const validImages = images
    .map((src, i) => ({ src, originalIndex: i }))
    .filter(({ originalIndex }) => !failedImages.has(originalIndex));

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + validImages.length) % validImages.length);
    },
    [validImages.length],
  );

  if (validImages.length === 0) {
    return (
      <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-navy-100 to-padel-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">No photos available</p>
      </div>
    );
  }

  // Clamp activeIndex to valid range
  const safeIndex = activeIndex >= validImages.length ? 0 : activeIndex;

  return (
    <>
      <div className="space-y-2">
        {/* Main image */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="relative aspect-[16/9] w-full overflow-hidden rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-500"
        >
          <Image
            src={validImages[safeIndex].src}
            alt={`${name} - Photo ${safeIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
            onError={() => handleImageError(validImages[safeIndex].originalIndex)}
          />
        </button>

        {/* Thumbnails */}
        {validImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {validImages.map(({ src, originalIndex }, index) => (
              <button
                key={originalIndex}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-hidden rounded-lg transition-all focus:outline-none",
                  index === safeIndex
                    ? "ring-2 ring-navy-500 opacity-100"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={src}
                  alt={`${name} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={() => handleImageError(originalIndex)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          role="dialog"
          aria-label="Photo lightbox"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Previous button */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Lightbox image */}
          <div className="relative h-[80vh] w-[90vw] max-w-5xl">
            <Image
              src={validImages[safeIndex].src}
              alt={`${name} - Photo ${safeIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              onError={() => handleImageError(validImages[safeIndex].originalIndex)}
            />
          </div>

          {/* Next button */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {safeIndex + 1} / {validImages.length}
          </div>
        </div>
      )}
    </>
  );
}
