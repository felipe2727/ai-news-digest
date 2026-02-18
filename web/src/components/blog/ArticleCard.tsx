import Link from "next/link";
import type { Article } from "@/lib/types";
import SourceBadge from "./SourceBadge";
import TopicTag from "./TopicTag";
import ScoreBadge from "./ScoreBadge";

export default function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const timeAgo = article.published_at
    ? formatTimeAgo(new Date(article.published_at))
    : null;

  return (
    <Link href={`/articles/${article.slug}`} className="block group">
      <div
        className={`glass rounded-xl p-5 transition-all duration-200 group-hover:border-[var(--accent)]/30 group-hover:translate-y-[-2px] ${
          featured ? "col-span-2" : ""
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <SourceBadge type={article.source_type} />
          {article.matched_topics[0] && (
            <TopicTag topic={article.matched_topics[0]} />
          )}
          <div className="ml-auto">
            <ScoreBadge score={article.score} />
          </div>
        </div>

        <h3
          className={`font-[var(--font-instrument-serif)] leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          {article.title}
        </h3>

        {article.summary && (
          <p
            className={`text-sm text-[var(--muted)] leading-relaxed ${
              featured ? "line-clamp-4" : "line-clamp-3"
            }`}
          >
            {article.summary}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-[var(--muted)]">
          <span>{article.source_name}</span>
          {timeAgo && (
            <>
              <span>·</span>
              <span>{timeAgo}</span>
            </>
          )}
          {"stars" in (article.extra || {}) && (
            <>
              <span>·</span>
              <span>&#11088; {String((article.extra as Record<string, unknown>).stars)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "1d ago";
  return `${diffD}d ago`;
}
