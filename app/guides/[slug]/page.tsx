import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import FAQSection from "@/components/ui/FAQSection";
import JsonLd from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { guideMetadata } from "@/lib/seo/metadata";
import { BASE_URL } from "@/lib/utils/constants";

interface GuideData {
  title: string;
  description: string;
  publishedAt: string;
  sections: { heading: string; content: string[] }[];
  faq: { question: string; answer: string }[];
}

const GUIDES: Record<string, GuideData> = {
  "how-to-play-padel": {
    title: "How to Play Padel: A Complete Beginner's Guide",
    description:
      "Learn how to play padel — scoring, serving, wall play, and tips for first-timers. Everything you need to get started on court.",
    publishedAt: "2026-02-20",
    sections: [
      {
        heading: "What is Padel?",
        content: [
          "Padel is a racket sport played in doubles on an enclosed court roughly one-third the size of a tennis court. The walls are made of glass and mesh, and they're in play — making rallies longer, more social, and more exciting than most other racket sports.",
          "Invented in Mexico in 1969, padel has exploded across Europe and Latin America, and is now the fastest-growing sport in the United States. It's easy to learn, incredibly social, and gives you a great workout.",
        ],
      },
      {
        heading: "Scoring and Match Format",
        content: [
          "Padel uses the same scoring system as tennis: 15, 30, 40, game. Deuce at 40-40 requires a two-point advantage (advantage in, advantage out). Sets are won by the first team to reach 6 games with a 2-game lead, or via tiebreak at 6-6.",
          "Most matches are best of 3 sets. The serve is underhand, hit below waist height, and must bounce once before being struck. The ball is served diagonally into the opposite service box.",
        ],
      },
      {
        heading: "The Serve",
        content: [
          "Unlike tennis, the padel serve is always underhand. Stand behind the service line, bounce the ball, and hit it below waist height. The ball must land in the diagonal service box. You get two attempts, just like tennis.",
          "The underhand serve keeps the game accessible for beginners — there's no powerful overhead motion to master before you can play. Focus on placement and consistency rather than power.",
        ],
      },
      {
        heading: "Wall Play — The Key Difference",
        content: [
          "The walls are what make padel unique. After the ball bounces on your side, it can hit the back or side walls and still be in play. You can return shots off the wall, which means rallies last much longer than in tennis or pickleball.",
          "Learning to read the ball off the glass takes practice but is incredibly rewarding. A common beginner mistake is trying to hit every ball before it reaches the wall. Instead, let the ball bounce and come off the wall, then play your shot with more time and better positioning.",
        ],
      },
      {
        heading: "Tips for First-Timers",
        content: [
          "Rent equipment first. Most padel facilities offer racket and ball rental so you can try the sport before investing. Padel rackets are solid (no strings) and much shorter than tennis rackets, making them easier to control.",
          "Wear court shoes with non-marking soles — running shoes don't provide the lateral support you need. Many facilities require specific footwear, so check before you go.",
          "Book a beginner lesson or open play session. Padel is best learned by playing, and most facilities organize sessions specifically for newcomers. You'll pick up the basics in your first hour on court.",
        ],
      },
    ],
    faq: [
      {
        question: "Is padel hard to learn?",
        answer:
          "Padel is one of the easiest racket sports to pick up. The underhand serve, enclosed court, and solid racket make it very beginner-friendly. Most people are having fun rallies within their first session.",
      },
      {
        question: "Do I need my own equipment to play padel?",
        answer:
          "No — most padel facilities offer equipment rental including rackets and balls. All you need is comfortable athletic clothing and court shoes with non-marking soles.",
      },
      {
        question: "Can you play padel with 2 players?",
        answer:
          "Padel is designed for doubles (4 players), but you can absolutely play singles. Some facilities offer smaller single-play courts. However, doubles is where padel really shines as a social sport.",
      },
      {
        question: "How long does a padel game take?",
        answer:
          "A typical padel match lasts 60-90 minutes. Most court bookings are for 60 or 90 minutes, which is enough for a full match and warm-up.",
      },
    ],
  },
  "padel-equipment": {
    title: "Padel Equipment Guide: Rackets, Balls, Shoes & More",
    description:
      "Everything you need to know about padel equipment — rackets, balls, shoes, and clothing. What to buy, what to rent, and how much it all costs.",
    publishedAt: "2026-02-20",
    sections: [
      {
        heading: "Padel Rackets",
        content: [
          "Padel rackets (or paddles) are solid — no strings — with a perforated face made of carbon fiber, fiberglass, or a composite. They're shorter and wider than tennis rackets, typically 45-46 cm long, making them easier to maneuver in the enclosed court.",
          "Rackets come in three shapes: round (best for beginners — large sweet spot, easy control), teardrop (balanced power and control for intermediate players), and diamond (top-heavy for power — advanced players only). Prices range from $50 for entry-level to $250+ for professional-grade rackets.",
        ],
      },
      {
        heading: "Choosing Your First Racket",
        content: [
          "For beginners, choose a round-shaped racket with a soft EVA foam core. These offer the largest sweet spot and most forgiveness on off-center hits. Look for a weight between 340-370 grams.",
          "Don't overspend on your first racket. A $60-$100 beginner racket will serve you well for your first 6-12 months. As your game develops, you'll better understand what weight, balance, and shape suit your playing style.",
        ],
      },
      {
        heading: "Padel Balls",
        content: [
          "Padel balls look similar to tennis balls but have slightly less pressure, making them slower and easier to control. The most popular brands are Head, Bullpadel, and Wilson. A can of 3 balls costs $5-$8.",
          "Fresh balls make a noticeable difference in play quality. Most facilities provide balls, but if you're playing frequently, bringing your own ensures consistent bounce. Balls lose pressure after 2-3 sessions of play.",
        ],
      },
      {
        heading: "Shoes",
        content: [
          "Proper court shoes are essential and often required by facilities. Look for shoes specifically designed for padel or clay court tennis. They need non-marking soles (herringbone or omni pattern), good lateral support, and a reinforced toe area.",
          "Popular brands include Asics, Adidas, Babolat, and Joma. Expect to pay $60-$150 for quality padel shoes. Don't use running shoes — they lack lateral support and can cause ankle injuries on the quick side-to-side movements padel demands.",
        ],
      },
      {
        heading: "Clothing and Accessories",
        content: [
          "Wear comfortable athletic clothing that allows free movement. Most players wear shorts/skirts and moisture-wicking shirts. There's no specific dress code, though some private clubs may have guidelines.",
          "Useful accessories include an overgrip for your racket ($3-$5, replace every few sessions), a padel bag to carry your gear ($30-$80), and a sweatband or cap for outdoor play. Some players also use vibration dampeners on their rackets.",
        ],
      },
      {
        heading: "Total Cost to Get Started",
        content: [
          "If you're just trying padel for the first time, you can rent equipment at most facilities for $5-$15 per session. All you need are court shoes and athletic clothing.",
          "To buy your own starter kit: beginner racket ($60-$100), court shoes ($60-$100), overgrip pack ($8), and a can of balls ($6). Total: roughly $135-$215. That's significantly less than getting started in golf, tennis, or skiing.",
        ],
      },
    ],
    faq: [
      {
        question: "What's the difference between padel and tennis rackets?",
        answer:
          "Padel rackets are solid (no strings) with a perforated face, shorter (45-46cm vs 68-73cm), and have a wrist strap that's mandatory during play. They're lighter and easier to maneuver than tennis rackets.",
      },
      {
        question: "Can I use tennis balls for padel?",
        answer:
          "Technically yes, but it's not recommended. Tennis balls have higher pressure and bounce differently. Padel-specific balls are designed for the sport's enclosed court and provide better gameplay.",
      },
      {
        question: "How much does a good padel racket cost?",
        answer:
          "Beginner rackets cost $50-$100, intermediate rackets $100-$180, and professional rackets $180-$300+. For most recreational players, a $60-$120 racket is ideal.",
      },
      {
        question: "Do I need special shoes for padel?",
        answer:
          "Yes — padel requires court shoes with non-marking soles and good lateral support. Many facilities require specific footwear. Running shoes are not suitable due to lack of lateral stability.",
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(GUIDES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) return {};
  return guideMetadata({ title: guide.title, description: guide.description, slug });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
    { label: guide.title.split(":")[0], href: `/guides/${slug}` },
  ];

  return (
    <>
      <JsonLd
        data={
          articleSchema({
            title: guide.title,
            description: guide.description,
            slug: `guides/${slug}`,
            publishedAt: guide.publishedAt,
          }) as unknown as Record<string, unknown>
        }
      />
      <JsonLd
        data={
          breadcrumbSchema(
            breadcrumbs.map((b) => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
          ) as unknown as Record<string, unknown>
        }
      />

      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <BreadcrumbNav items={breadcrumbs} />

        <h1 className="mt-6 font-display text-3xl font-extrabold text-gray-900 md:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          {guide.description}
        </p>

        <div className="mt-8 space-y-10">
          {guide.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-2xl font-bold text-gray-900">
                {section.heading}
              </h2>
              {section.content.map((paragraph, j) => (
                <p key={j} className="mt-3 text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <FAQSection items={guide.faq} />
        </section>

        {/* Find Courts CTA */}
        <section className="mt-12 rounded-xl bg-gradient-to-r from-padel-600 to-padel-800 px-6 py-8 text-center text-white">
          <h2 className="text-xl font-bold">
            Ready to Get on Court?
          </h2>
          <p className="mt-2 text-padel-100">
            Find padel courts near you with our comprehensive directory.
          </p>
          <Link
            href="/courts"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-padel-700 transition-colors hover:bg-gray-100"
          >
            Find Courts Near You
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </article>
    </>
  );
}
