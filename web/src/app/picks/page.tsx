import Link from "next/link";
import { getDigestsWithPicks } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WindowChrome from "@/components/shared/WindowChrome";
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
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        <Link
          href="/"
          className="text-[11px] font-mono text-muted hover:text-primary transition-colors mb-6 inline-block"
        >
          &larr; cd /home
        </Link>

        <h1 className="serif-headline text-6xl md:text-8xl font-black uppercase tracking-tight mb-2">
          Build Library
        </h1>
        <p className="text-sm font-mono text-muted mb-10">
          AI-generated project and business ideas inspired by each day&apos;s
          trending news.
        </p>

        {digests.length === 0 && (
          <p className="text-muted text-center py-20 font-mono text-sm">
            No ideas yet. Run the pipeline to generate your first digest.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          {digests.flatMap((digest) => {
            const picks = parseProjectPicks(digest.project_recommendations);
            if (!picks.length) return [];

            const dateStr = new Date(digest.generated_at).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            );

            return picks.map((pick, i) => (
              <div
                key={`${digest.id}-${i}`}
                className="border-b border-r border-border"
              >
                <WindowChrome filename={`${pick.category || "project"}-${dateStr.toLowerCase().replace(/\s/g, "")}.md`}>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">
                        {CATEGORY_ICONS[pick.category] || CATEGORY_ICONS.tool}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary/70">
                        {pick.category}
                      </span>
                      <span className="ml-auto text-[10px] font-mono text-muted">
                        {dateStr}
                      </span>
                    </div>

                    <h3 className="serif-headline text-lg leading-tight mb-2 text-foreground">
                      {pick.name}
                    </h3>

                    <p className="text-xs text-muted leading-relaxed font-mono line-clamp-3 mb-3">
                      {pick.description}
                    </p>

                    {pick.why && (
                      <div className="border border-primary/20 bg-primary/5 p-3 mb-3">
                        <p className="text-[10px] font-mono text-primary uppercase tracking-wider mb-1">
                          Impact Analysis
                        </p>
                        <p className="text-[11px] font-mono text-muted leading-relaxed">
                          {pick.why}
                        </p>
                      </div>
                    )}

                    <span className="text-[11px] font-mono text-primary hover:underline">
                      Retrieve_Blueprint &rarr;
                    </span>
                  </div>
                </WindowChrome>
              </div>
            ));
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
