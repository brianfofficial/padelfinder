import Link from "next/link";
import { MapPin } from "lucide-react";
import { SITE_NAME } from "@/lib/utils/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-100">
        <MapPin className="h-8 w-8 text-navy-600" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-gray-900">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-gray-600">
        Sorry, we could not find the page you are looking for. It may have been
        moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-800"
        >
          Back to {SITE_NAME}
        </Link>
        <Link
          href="/states"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Browse by State
        </Link>
      </div>
    </div>
  );
}
