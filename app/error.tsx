"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-gray-900">
        Something went wrong
      </h1>
      <p className="mt-3 text-gray-600">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-navy-700 px-6 py-2.5 font-medium text-white hover:bg-navy-800"
      >
        Try Again
      </button>
    </div>
  );
}
