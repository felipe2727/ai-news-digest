import Link from "next/link";
import { getBuildLibraryProjects } from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WindowChrome from "@/components/shared/WindowChrome";

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
  const library = await getBuildLibraryProjects(30);

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

        {library.length === 0 && (
          <p className="text-muted text-center py-20 font-mono text-sm">
            No ideas yet. Run the pipeline to generate your first digest.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 auto-rows-[420px]">
          {library.map((entry) => {
            const pick = entry.pick;
            const dateStr = new Date(entry.generated_at).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            );

            return (
              <div
                key={`${entry.date}-${entry.digest_id}`}
                className="border-b border-r border-border h-full"
              >
                <WindowChrome
                  filename={`${pick.category || "project"}-${dateStr.toLowerCase().replace(/\s/g, "")}.md`}
                  className="h-full flex flex-col"
                  contentClassName="flex-1"
                >
                  <div className="p-5 h-full flex flex-col">
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

                    <h3 className="serif-headline text-lg leading-tight mb-2 text-foreground line-clamp-2">
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
                        <p className="text-[11px] font-mono text-muted leading-relaxed line-clamp-4">
                          {pick.why}
                        </p>
                      </div>
                    )}

                    <span className="text-[11px] font-mono text-primary hover:underline mt-auto">
                      Retrieve_Blueprint &rarr;
                    </span>
                  </div>
                </WindowChrome>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
