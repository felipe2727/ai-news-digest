import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
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
  if (!article) notFound();

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
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/articles"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6 inline-block"
        >
          &larr; Back to articles
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <SourceBadge type={article.source_type} />
            {article.matched_topics.map((t) => (
              <TopicTag key={t} topic={t} />
            ))}
            <div className="ml-auto">
              <ScoreBadge score={article.score} />
            </div>
          </div>

          <h1 className="font-[var(--font-instrument-serif)] text-3xl md:text-4xl leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <span>{article.source_name}</span>
            {publishedStr && (
              <>
                <span>·</span>
                <span>{publishedStr}</span>
              </>
            )}
            {"stars" in (article.extra || {}) && (
              <>
                <span>·</span>
                <span>&#11088; {String((article.extra as Record<string, unknown>).stars)} stars</span>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="glass rounded-xl p-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2">
            AI Summary
          </p>
          <p className="leading-relaxed">{article.summary}</p>
        </div>

        {/* CTA */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent)] text-[var(--background)] font-semibold hover:bg-[var(--accent-hover)] transition-colors mb-12"
        >
          Read the original
          <span aria-hidden>&#8599;</span>
        </a>

        {/* Related articles */}
        {related.length > 0 && (
          <section>
            <h2 className="font-[var(--font-instrument-serif)] text-xl mb-4">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {related.map((r) => (
                <ArticleCard key={r.id} article={r} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
