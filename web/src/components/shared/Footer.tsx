import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="font-[var(--font-instrument-serif)] text-lg mb-2">
              AI News Digest
            </p>
            <p className="text-sm text-[var(--muted)] max-w-xs">
              Curated AI news, scored and summarized daily. Powered by Gemini.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-xs uppercase tracking-wider text-[var(--muted)] mb-1">
                Navigate
              </p>
              <Link href="/" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                Home
              </Link>
              <Link href="/articles" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                Articles
              </Link>
              <Link href="/search" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                Search
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-xs uppercase tracking-wider text-[var(--muted)] mb-1">
                Subscribe
              </p>
              <Link href="/subscribe" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                Newsletter
              </Link>
              <Link
                href="https://github.com/felipe2727/ai-news-digest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
          &copy; {new Date().getFullYear()} AI News Digest
        </div>
      </div>
    </footer>
  );
}
