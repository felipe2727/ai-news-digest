import Link from "next/link";
import { getDigestsWithPicks } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { parseProjectPicks } from "@/components/blog/ProjectPicks";

const CATEGORY_ICONS: Record<string, string> = {
  tool: "\u{1F6E0}\u{FE0F}",
  framework: "\u{1F4E6}",
  model: "\u{1F9E0}",
  library: "\u{1F4DA}",
  saas: "\u{1F680}",
  community: "\u{1F465}",
  marketplace: "\u{1F6D2}",
};

export default async function PicksPage() {
  const digests = await getDigestsWithPicks(30);

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

        <h1 className="font-[var(--font-instrument-serif)] text-4xl mb-2">
          Build This
        </h1>
        <p className="text-sm text-[var(--muted)] mb-10">
          AI-generated project and business ideas inspired by each day&apos;s
          trending news.
        </p>

        {digests.length === 0 && (
          <p className="text-[var(--muted)] text-center py-20">
            No ideas yet. Run the pipeline to generate your first digest.
          </p>
        )}

        {digests.map((digest) => {
          const picks = parseProjectPicks(digest.project_recommendations);
          if (!picks.length) return null;

          const dateStr = new Date(digest.generated_at).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          );

          return (
            <section key={digest.id} className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-semibold text-lg">{dateStr}</h2>
                <Link
                  href={`/digest/${digest.id}`}
                  className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                >
                  View digest &rarr;
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {picks.map((pick, i) => (
                  <div
                    key={i}
                    className="glass rounded-xl p-6 border-l-4 border-l-emerald-500/40 block"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl mt-0.5">
                        {CATEGORY_ICONS[pick.category] || CATEGORY_ICONS.tool}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {pick.category}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                          {pick.name}
                        </h3>
                        <p className="text-sm text-[var(--muted)] leading-relaxed mb-2">
                          {pick.description}
                        </p>
                        <p className="text-xs text-emerald-500/80 leading-relaxed">
                          {pick.why}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
      <Footer />
    </>
  );
}
