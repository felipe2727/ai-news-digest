import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WindowChrome from "@/components/shared/WindowChrome";
import SourceBadge from "@/components/blog/SourceBadge";
import TopicTag from "@/components/blog/TopicTag";
import ScoreBadge from "@/components/blog/ScoreBadge";
import ArticleCard from "@/components/blog/ArticleCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };

  return {
    title: article.title,
    description: article.summary.slice(0, 160),
    openGraph: {
      title: article.title,
      description: article.summary.slice(0, 160),
      type: "article",
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return notFound();

  const related = await getRelatedArticles(article);

  const publishedStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <Link
          href="/"
          className="text-[11px] font-mono text-muted hover:text-primary transition-colors mb-6 inline-block"
        >
          &larr; cd /home
        </Link>

        <WindowChrome filename={`${article.slug}.md`}>
          <div className="p-6 md:p-8">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <SourceBadge type={article.source_type} />
              {article.matched_topics.map((t) => (
                <TopicTag key={t} topic={t} />
              ))}
              <div className="ml-auto">
                <ScoreBadge score={article.score} />
              </div>
            </div>

            {/* Title */}
            <h1 className="serif-headline text-3xl md:text-4xl leading-tight mb-4">
              {article.title}
            </h1>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-muted mb-6">
              <span>{article.source_name}</span>
              {publishedStr && (
                <>
                  <span className="text-border">|</span>
                  <span>{publishedStr}</span>
                </>
              )}
              {"stars" in (article.extra || {}) && (
                <>
                  <span className="text-border">|</span>
                  <span>&#9733; {String((article.extra as Record<string, unknown>).stars)} stars</span>
                </>
              )}
            </div>

            {/* Summary */}
            <div className="border border-border p-5 mb-6">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary mb-2">
                // AI Summary
              </p>
              <p className="text-sm leading-relaxed font-mono text-muted">
                {article.summary}
              </p>
            </div>

            {/* CTA */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary text-primary text-sm font-mono hover:bg-primary hover:text-black transition-colors"
            >
              Read the original &rarr;
            </a>
          </div>
        </WindowChrome>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="serif-headline text-xl mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2">
              {related.map((r) => (
                <div key={r.id} className="border-b border-r border-border">
                  <ArticleCard article={r} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
