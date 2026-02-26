import Link from "next/link";
import type { Article } from "@/lib/types";
import SourceBadge from "./SourceBadge";
import TopicTag from "./TopicTag";
import ScoreBadge from "./ScoreBadge";

function HeroGradient({ topic }: { topic?: string }) {
  const gradients: Record<string, string> = {
    coding_assistants: "from-emerald-900/40 via-cyan-900/30 to-transparent",
    open_source_models: "from-violet-900/40 via-purple-900/30 to-transparent",
    ai_agents: "from-blue-900/40 via-indigo-900/30 to-transparent",
    llm_releases: "from-rose-900/40 via-pink-900/30 to-transparent",
    default: "from-emerald-900/40 via-zinc-900/30 to-transparent",
  };
  const gradient = gradients[topic || ""] || gradients.default;

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
      <div className="absolute inset-0 bg-grid opacity-30" />
    </div>
  );
}

export default function HeroSection({ article }: { article: Article }) {
  const heroImage = (article.extra as Record<string, unknown>)?.hero_image as
    | string
    | undefined;

  return (
    <section className="border border-border mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Image / Gradient */}
        <div className="relative lg:col-span-7 min-h-[300px] lg:min-h-[450px] overflow-hidden scanline-hover">
          {heroImage ? (
            <img
              src={heroImage}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover saturate-50 hover:saturate-100 transition-all duration-500"
            />
          ) : (
            <HeroGradient topic={article.matched_topics[0]} />
          )}
          {/* Spotlight badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest bg-primary text-black">
              Spotlight
            </span>
          </div>
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-border">
          <div className="flex items-center gap-2 mb-4">
            <SourceBadge type={article.source_type} />
            {article.matched_topics[0] && (
              <TopicTag topic={article.matched_topics[0]} />
            )}
            <div className="ml-auto">
              <ScoreBadge score={article.score} />
            </div>
          </div>

          <h1 className="serif-headline text-3xl md:text-4xl lg:text-5xl leading-[1.1] mb-6 text-foreground">
            {article.title}
          </h1>

          {article.summary && (
            <div className="border-l-2 border-primary pl-4 mb-6">
              <p className="text-sm text-muted leading-relaxed font-mono">
                {article.summary}
              </p>
            </div>
          )}

          {/* Metadata table */}
          <div className="text-[11px] font-mono text-muted space-y-1 mb-6">
            <div className="flex gap-2">
              <span className="text-primary">source:</span>
              <span>{article.source_name}</span>
            </div>
            {article.published_at && (
              <div className="flex gap-2">
                <span className="text-primary">date:</span>
                <span>
                  {new Date(article.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/articles/${article.slug}`}
            className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:underline underline-offset-4"
          >
            Read Article &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
