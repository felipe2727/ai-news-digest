import { getArticles } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ArticleCard from "@/components/blog/ArticleCard";

const TOPICS = [
  "coding_assistants",
  "open_source",
  "breaking_news",
  "media_generation",
  "agents",
  "entrepreneurship",
  "github_repos",
];

const SOURCES = ["reddit", "youtube", "news", "github"] as const;

export const metadata = {
  title: "Articles",
  description: "Browse all AI news articles, filtered by topic and source.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; source?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const articles = await getArticles({
    topic: params.topic,
    source: params.source,
    sort: (params.sort as "score" | "date") || "score",
    limit: 50,
  });

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Left sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              Topics
            </p>
            <div className="flex flex-col gap-1 mb-6">
              <a
                href="/articles"
                className={`text-sm px-3 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors ${
                  !params.topic ? "text-[var(--accent)]" : "text-[var(--muted)]"
                }`}
              >
                All Topics
              </a>
              {TOPICS.map((t) => (
                <a
                  key={t}
                  href={`/articles?topic=${t}${params.source ? `&source=${params.source}` : ""}`}
                  className={`text-sm px-3 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors ${
                    params.topic === t
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </a>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              Sources
            </p>
            <div className="flex flex-col gap-1 mb-6">
              {SOURCES.map((s) => (
                <a
                  key={s}
                  href={`/articles?source=${s}${params.topic ? `&topic=${params.topic}` : ""}`}
                  className={`text-sm px-3 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors capitalize ${
                    params.source === s
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {s}
                </a>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              Sort
            </p>
            <div className="flex flex-col gap-1">
              <a
                href={`/articles?sort=score${params.topic ? `&topic=${params.topic}` : ""}${params.source ? `&source=${params.source}` : ""}`}
                className={`text-sm px-3 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors ${
                  params.sort !== "date"
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                }`}
              >
                By Relevance
              </a>
              <a
                href={`/articles?sort=date${params.topic ? `&topic=${params.topic}` : ""}${params.source ? `&source=${params.source}` : ""}`}
                className={`text-sm px-3 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors ${
                  params.sort === "date"
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                }`}
              >
                By Date
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <h1 className="font-[var(--font-instrument-serif)] text-3xl mb-6">
            Articles
          </h1>

          {articles.length === 0 ? (
            <div className="text-center py-20 text-[var(--muted)]">
              No articles found matching your filters.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
