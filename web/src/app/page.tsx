import { getLatestDigest } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/blog/HeroSection";
import ArticleGrid from "@/components/blog/ArticleGrid";
import ProjectPicks, { parseProjectPicks } from "@/components/blog/ProjectPicks";

export default async function HomePage() {
  const data = await getLatestDigest();

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center py-20 text-[var(--muted)]">
            <h1 className="font-[var(--font-instrument-serif)] text-4xl mb-4">
              AI News Digest
            </h1>
            <p>No digests yet. Run the pipeline to generate your first digest.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { digest, articles } = data;
  const featured = articles[0];
  const rest = articles.slice(1);

  const dateStr = new Date(digest.generated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {featured && <HeroSection article={featured} />}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-[var(--font-instrument-serif)] text-2xl">
              Today&apos;s Digest &mdash; {dateStr}
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              {digest.total_items} items from {digest.sources_checked} sources
            </p>
          </div>
        </div>

        {digest.intro_summary && (
          <div className="glass rounded-xl p-6 mb-6 border-l-4 border-l-[var(--accent)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2">
              TL;DR
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {digest.intro_summary}
            </p>
          </div>
        )}

        <ProjectPicks picks={parseProjectPicks(digest.project_recommendations)} compact />

        <ArticleGrid articles={rest} />
      </main>
      <Footer />
    </>
  );
}
