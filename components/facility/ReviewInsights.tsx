import {
  Sparkles,
  ThumbsUp,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";

interface ReviewInsightsProps {
  summary: string;
  pros: string[] | null;
  cons: string[] | null;
  bestForTags: string[] | null;
  standoutQuote: string | null;
  ownerResponseRate: number | null;
}

export default function ReviewInsights({
  summary,
  pros,
  cons,
  bestForTags,
  standoutQuote,
  ownerResponseRate,
}: ReviewInsightsProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
      {/* Header + Summary */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-padel-600" />
          <h2 className="text-xl font-bold text-gray-900">What Players Say</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">{summary}</p>
      </div>

      {/* Pros / Cons grid */}
      {((pros && pros.length > 0) || (cons && cons.length > 0)) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pros && pros.length > 0 && (
            <div className="space-y-2">
              {pros.map((pro) => (
                <div key={pro} className="flex items-start gap-2 text-sm">
                  <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-gray-700">{pro}</span>
                </div>
              ))}
            </div>
          )}
          {cons && cons.length > 0 && (
            <div className="space-y-2">
              {cons.map((con) => (
                <div key={con} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-gray-700">{con}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Best-for tags */}
      {bestForTags && bestForTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {bestForTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-padel-50 px-3 py-1 text-xs font-medium text-padel-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Standout quote */}
      {standoutQuote && (
        <blockquote className="border-l-4 border-padel-300 pl-4 italic text-gray-600 text-sm">
          &ldquo;{standoutQuote}&rdquo;
        </blockquote>
      )}

      {/* Owner response rate */}
      {ownerResponseRate != null && ownerResponseRate >= 50 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MessageCircle className="h-4 w-4 text-padel-600" />
          <span>
            Owner responds to{" "}
            <span className="font-semibold text-gray-700">
              {Math.round(ownerResponseRate)}%
            </span>{" "}
            of reviews
          </span>
        </div>
      )}
    </section>
  );
}
