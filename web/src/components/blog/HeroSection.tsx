import type { Article } from "@/lib/types";
import SourceBadge from "./SourceBadge";
import TopicTag from "./TopicTag";
import ScoreBadge from "./ScoreBadge";

export default function HeroSection({ article }: { article: Article }) {
  return (
    <section className="relative mb-16">
      <div className="glass rounded-2xl p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <ScoreBadge score={article.score} />
          {article.matched_topics[0] && (
            <TopicTag topic={article.matched_topics[0]} />
          )}
          <span className="text-xs text-[var(--muted)]">
            {article.source_name}
          </span>
        </div>

        <h1 className="font-[var(--font-instrument-serif)] text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6 max-w-4xl">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-lg text-[var(--muted)] leading-relaxed max-w-2xl mb-8">
            {article.summary}
          </p>
        )}

        <div className="flex items-center gap-4">
          <SourceBadge type={article.source_type} />
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--background)] font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors"
          >
            Read More
            <span aria-hidden>&#8599;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
