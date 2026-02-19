import { notFound } from "next/navigation";
import Link from "next/link";
import { getDigestById } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ArticleCard from "@/components/blog/ArticleCard";
import ProjectPicks, { parseProjectPicks } from "@/components/blog/ProjectPicks";

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDigestById(id);
  if (!data) notFound();

  const { digest, articles } = data;

  // Group articles by section_title
  const sections = new Map<string, typeof articles>();
  for (const article of articles) {
    const key = article.section_title || "Other";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(article);
  }

  const dateStr = new Date(digest.generated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6 inline-block"
        >
          &larr; Back to home
        </Link>

        <h1 className="font-[var(--font-instrument-serif)] text-3xl mb-2">
          Digest &mdash; {dateStr}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          {digest.total_items} items from {digest.sources_checked} sources
        </p>

        {digest.intro_summary && (
          <div className="glass rounded-xl p-6 mb-10 border-l-4 border-l-[var(--accent)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2">
              TL;DR
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {digest.intro_summary}
            </p>
          </div>
        )}

        {[...sections.entries()].map(([title, items]) => (
          <section key={title} className="mb-10">
            <h2 className="font-semibold text-lg mb-4 pb-2 border-b border-[var(--border)]">
              {title}
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ))}

        <ProjectPicks picks={parseProjectPicks(digest.project_recommendations)} />
      </main>
      <Footer />
    </>
  );
}
