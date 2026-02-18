import Link from "next/link";
import { Search } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-[var(--font-instrument-serif)] text-xl">
          AI News Digest
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/articles"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Articles
          </Link>
          <Link
            href="/search"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            <Search size={14} />
            Search
          </Link>
          <Link
            href="/subscribe"
            className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--background)] font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </nav>
  );
}
