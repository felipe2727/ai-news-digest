import {
  getLatestDigest,
  getDigestByDate,
  getAvailableDigestDates,
} from "@/lib/queries";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/blog/HeroSection";
import ArticleGrid from "@/components/blog/ArticleGrid";
import TLDRBar from "@/components/blog/TLDRBar";
import { parseProjectPicks } from "@/components/blog/ProjectPicks";
import DigestDateNav from "@/components/blog/DigestDateNav";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const data = date
    ? await getDigestByDate(date)
    : await getLatestDigest();

  const availableDates = await getAvailableDigestDates();

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-20">
          <div className="text-center py-20 text-muted font-mono">
            <h1 className="serif-headline text-4xl mb-4">AI News Digest</h1>
            {date ? (
              <p className="text-sm">No digest found for {date}. Try a different date.</p>
            ) : (
              <p className="text-sm">No digests yet. Run the pipeline to generate your first digest.</p>
            )}
            {availableDates.length > 0 && (
              <div className="mt-6 flex justify-center">
                <DigestDateNav
                  currentDate={date || ""}
                  availableDates={availableDates}
                />
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { digest, articles } = data;
  const featured = articles[0];
  const rest = articles.slice(1);

  const currentDate =
    new Date(digest.generated_at).toISOString().split("T")[0];

  const dateStr = new Date(digest.generated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isLatest = !date || currentDate === availableDates[0];
  const picks = parseProjectPicks(digest.project_recommendations);

  return (
    <>
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Hero */}
        {featured && <HeroSection article={featured} />}

        {/* TL;DR */}
        <TLDRBar summary={digest.intro_summary} />

        {/* Digest header + date nav */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="serif-headline text-2xl">
              {isLatest ? "Today\u2019s" : ""} Digest &mdash; {dateStr}
            </h2>
            <p className="text-[11px] font-mono text-muted mt-1">
              {digest.total_items} items from {digest.sources_checked} sources
            </p>
          </div>
          {availableDates.length > 1 && (
            <DigestDateNav
              currentDate={currentDate}
              availableDates={availableDates}
            />
          )}
        </div>

        {/* Article Grid with BuildThis card */}
        <ArticleGrid
          articles={rest}
          buildThisPick={picks[0] || null}
        />
      </main>
      <Footer />
    </>
  );
}
