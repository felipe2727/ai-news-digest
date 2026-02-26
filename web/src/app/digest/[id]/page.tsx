import { notFound } from "next/navigation";
import Link from "next/link";
import { getDigestById } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ArticleCard from "@/components/blog/ArticleCard";
import BuildThisCard from "@/components/blog/BuildThisCard";
import TLDRBar from "@/components/blog/TLDRBar";
import { parseProjectPicks } from "@/components/blog/ProjectPicks";

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDigestById(id);
  if (!data) return notFound();

  const { digest, articles } = data;

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

  const picks = parseProjectPicks(digest.project_recommendations);

  return (
    <>
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        <Link
          href="/"
          className="text-[11px] font-mono text-muted hover:text-primary transition-colors mb-6 inline-block"
        >
          &larr; cd /home
        </Link>

        <h1 className="serif-headline text-3xl mb-2">
          Digest &mdash; {dateStr}
        </h1>
        <p className="text-[11px] font-mono text-muted mb-8">
          {digest.total_items} items from {digest.sources_checked} sources
        </p>

        <TLDRBar summary={digest.intro_summary} />

        {[...sections.entries()].map(([title, items]) => (
          <section key={title} className="mb-10">
            <h2 className="serif-headline text-lg mb-4 pb-2 border-b border-border">
              {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {items.map((article) => (
                <div key={article.id} className="border-b border-r border-border">
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          </section>
        ))}

        {picks.length > 0 && (
          <section className="mb-10">
            <h2 className="serif-headline text-lg mb-4 pb-2 border-b border-border">
              Build This
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {picks.map((pick, i) => (
                <div key={i} className="border-b border-r border-border">
                  <BuildThisCard pick={pick} />
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
