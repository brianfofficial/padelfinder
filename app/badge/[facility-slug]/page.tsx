import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Code, ExternalLink } from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import { getFacilityBySlug } from "@/lib/queries/facilities";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";

interface PageProps {
  params: Promise<{ "facility-slug": string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "facility-slug": slug } = await params;
  const facility = await getFacilityBySlug(slug);
  if (!facility) return {};
  return {
    title: `Badge for ${facility.name} | ${SITE_NAME}`,
    description: `Embed the ${SITE_NAME} badge for ${facility.name} on your website.`,
    robots: { index: false },
  };
}

export default async function BadgeEmbedPage({ params }: PageProps) {
  const { "facility-slug": slug } = await params;
  const facility = await getFacilityBySlug(slug);
  if (!facility) notFound();

  const badgeUrl = `${BASE_URL}/api/badge/${facility.slug}`;
  const facilityUrl = `${BASE_URL}/courts/${facility.slug}`;
  const embedCode = `<a href="${facilityUrl}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="${facility.name} on PadelFinder" width="220" height="60" /></a>`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: facility.name, href: `/courts/${facility.slug}` },
    { label: "Badge", href: `/badge/${facility.slug}` },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BreadcrumbNav items={breadcrumbs} />

      <h1 className="mt-6 font-display text-2xl font-extrabold text-gray-900">
        Badge for {facility.name}
      </h1>
      <p className="mt-2 text-gray-600">
        Add this badge to your website to show you&apos;re listed on {SITE_NAME}.
      </p>

      {/* Badge Preview */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Preview</h2>
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-8">
          <a href={facilityUrl}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl}
              alt={`${facility.name} on PadelFinder`}
              width={220}
              height={60}
            />
          </a>
        </div>
      </section>

      {/* Embed Code */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Code className="h-5 w-5 text-navy-600" />
          Embed Code
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          Copy and paste this HTML snippet into your website:
        </p>
        <div className="rounded-lg border border-gray-300 bg-gray-900 p-4">
          <code className="block whitespace-pre-wrap break-all text-sm text-green-400">
            {embedCode}
          </code>
        </div>
      </section>

      {/* Back link */}
      <div className="mt-8 flex items-center gap-4">
        <Link
          href={`/courts/${facility.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View {facility.name} listing
        </Link>
      </div>
    </div>
  );
}
