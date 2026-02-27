import Link from "next/link";
import type { Article } from "@/lib/types";
import WindowChrome from "@/components/shared/WindowChrome";
import { sourceFilenames } from "./SourceBadge";

export default function ArticleCard({ article }: { article: Article }) {
  const timeAgo = article.published_at
    ? formatTimeAgo(new Date(article.published_at))
    : null;

  const filename = sourceFilenames[article.source_type] || "article.md";

  return (
    <Link href={`/articles/${article.slug}`} className="block group h-full">
      <WindowChrome
        filename={filename}
        className="h-full flex flex-col"
        contentClassName="flex-1"
      >
        <div className="p-5 h-full flex flex-col">
          {/* Category as code syntax */}
          {article.matched_topics[0] && (
            <div className="mb-3 text-[11px] font-mono text-muted">
              <span className="text-primary">export const</span>{" "}
              <span className="text-foreground">category</span>{" "}
              <span className="text-primary">=</span>{" "}
              <span className="text-muted">&quot;{article.matched_topics[0].replace(/_/g, " ")}&quot;</span>
            </div>
          )}

          {/* Headline */}
          <h3 className="serif-headline text-lg leading-tight mb-2 text-foreground group-hover:text-primary transition-colors decoration-primary underline-offset-4 group-hover:underline line-clamp-3">
            {article.title}
          </h3>

          {/* Summary */}
          {article.summary && (
            <p className="text-xs text-muted leading-relaxed font-mono line-clamp-3 mb-4">
              {article.summary}
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto border-t border-dashed border-border pt-3 flex items-center justify-between text-[11px] font-mono text-muted">
            <span className="text-primary font-bold">
              &#9733; {Math.round(article.score)} pts
            </span>
            <div className="flex items-center gap-2">
              <span>{article.source_name}</span>
              {timeAgo && (
                <>
                  <span className="text-border">|</span>
                  <span>{timeAgo}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </WindowChrome>
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
