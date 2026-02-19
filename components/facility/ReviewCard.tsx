"use client";

import { useState } from "react";
import { User, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import RatingStars from "@/components/facility/RatingStars";
import type { Review } from "@/lib/types/facility";
import { formatRelativeDate } from "@/lib/utils/format";

const COLLAPSE_LENGTH = 300;

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const body = review.source === "google" ? review.text : review.comment;
  const isLong = body ? body.length > COLLAPSE_LENGTH : false;
  const displayText =
    body && isLong && !expanded ? body.slice(0, COLLAPSE_LENGTH) + "..." : body;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-navy-700">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {review.author_name}
            </p>
            {review.source === "google" ? (
              <p className="text-xs text-gray-500">Posted on Google</p>
            ) : (
              review.skill_level && (
                <p className="text-xs text-gray-500 capitalize">
                  {review.skill_level} player
                </p>
              )
            )}
          </div>
        </div>
        <RatingStars rating={review.rating} size="sm" />
      </div>

      {/* Body */}
      {displayText && (
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {displayText}
        </p>
      )}

      {/* Read more toggle */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Read more <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}

      {/* Owner response */}
      {review.owner_response && (
        <div className="mt-3 border-l-2 border-gray-300 pl-4">
          <p className="text-xs font-semibold text-gray-700">Owner response</p>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            {review.owner_response}
          </p>
          {review.owner_response_date && (
            <p className="mt-1 text-xs text-gray-400">
              {formatRelativeDate(review.owner_response_date)}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center gap-3">
        <p className="text-xs text-gray-400">
          {formatRelativeDate(review.published_at ?? review.created_at)}
        </p>
        {review.helpful_count > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <ThumbsUp className="h-3 w-3" />
            {review.helpful_count}
          </span>
        )}
      </div>
    </div>
  );
}
