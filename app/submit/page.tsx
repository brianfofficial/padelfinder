import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/utils/constants";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: `Submit a Court | ${SITE_NAME}`,
  description:
    "Know a padel court that's not in our directory? Submit it here and help fellow players find new places to play.",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-gray-900">
        Submit a Padel Court
      </h1>
      <p className="mt-2 text-gray-600">
        Know a padel facility that&apos;s not in our directory? Help the
        community by adding it below. All submissions are reviewed before
        publishing.
      </p>
      <div className="mt-8">
        <SubmitForm />
      </div>
    </div>
  );
}
