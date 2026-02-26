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
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 flex gap-8">
        {/* Left sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-16 pt-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary mb-3">
              // topics
            </p>
            <div className="flex flex-col gap-0.5 mb-6">
              <a
                href="/articles"
                className={`text-[11px] font-mono px-3 py-1.5 border-l-2 transition-colors ${
                  !params.topic
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                All Topics
              </a>
              {TOPICS.map((t) => (
                <a
                  key={t}
                  href={`/articles?topic=${t}${params.source ? `&source=${params.source}` : ""}`}
                  className={`text-[11px] font-mono px-3 py-1.5 border-l-2 transition-colors ${
                    params.topic === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </a>
              ))}
            </div>

            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary mb-3">
              // sources
            </p>
            <div className="flex flex-col gap-0.5 mb-6">
              {SOURCES.map((s) => (
                <a
                  key={s}
                  href={`/articles?source=${s}${params.topic ? `&topic=${params.topic}` : ""}`}
                  className={`text-[11px] font-mono px-3 py-1.5 border-l-2 transition-colors capitalize ${
                    params.source === s
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {s}
                </a>
              ))}
            </div>

            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary mb-3">
              // sort
            </p>
            <div className="flex flex-col gap-0.5">
              <a
                href={`/articles?sort=score${params.topic ? `&topic=${params.topic}` : ""}${params.source ? `&source=${params.source}` : ""}`}
                className={`text-[11px] font-mono px-3 py-1.5 border-l-2 transition-colors ${
                  params.sort !== "date"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                By Relevance
              </a>
              <a
                href={`/articles?sort=date${params.topic ? `&topic=${params.topic}` : ""}${params.source ? `&source=${params.source}` : ""}`}
                className={`text-[11px] font-mono px-3 py-1.5 border-l-2 transition-colors ${
                  params.sort === "date"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                By Date
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <h1 className="serif-headline text-3xl mb-6">Articles</h1>

          {articles.length === 0 ? (
            <div className="text-center py-20 text-muted font-mono text-sm">
              No articles found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {articles.map((article) => (
                <div key={article.id} className="border-b border-r border-border">
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
