import Link from "next/link";
import { MapPin } from "lucide-react";

const STATE_LINKS = [
  { name: "Florida", slug: "florida" },
  { name: "California", slug: "california" },
  { name: "Texas", slug: "texas" },
  { name: "New York", slug: "new-york" },
  { name: "Arizona", slug: "arizona" },
  { name: "Colorado", slug: "colorado" },
  { name: "Illinois", slug: "illinois" },
  { name: "Georgia", slug: "georgia" },
];

const RESOURCE_LINKS = [
  { href: "/blog/what-is-padel", label: "What is Padel?" },
  { href: "/blog/padel-vs-pickleball", label: "Padel vs Pickleball" },
  { href: "/blog/padel-rules", label: "Padel Rules" },
  { href: "/blog", label: "All Articles" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/submit", label: "Add a Court" },
  { href: "/advertise", label: "Advertise" },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-padel-600" />
              <span className="font-display text-lg font-bold text-navy-900">
                Padel<span className="text-padel-600">Finder</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              The most comprehensive directory of padel courts in the United
              States. Find, compare, and book your next game.
            </p>
          </div>

          {/* Popular States */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Popular States
            </h3>
            <ul className="mt-3 space-y-2">
              {STATE_LINKS.map((state) => (
                <li key={state.slug}>
                  <Link
                    href={`/states/${state.slug}`}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {state.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/states"
                  className="text-sm font-medium text-navy-600 hover:text-navy-700"
                >
                  All States →
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
            <ul className="mt-3 space-y-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Company</h3>
            <ul className="mt-3 space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <a
              href="https://x.com/padelfinder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Follow us on X"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/padelfinder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Follow us on Instagram"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
          <p className="text-center text-sm text-gray-500 mb-2">
            Built with love for the US padel community
          </p>
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PadelFinder. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
