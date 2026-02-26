import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Manifest */}
          <div className="md:col-span-1">
            <p className="text-[11px] font-mono text-primary uppercase tracking-wider mb-3">
              // manifest.json
            </p>
            <p className="text-sm text-muted leading-relaxed font-mono">
              Curated AI news, scored and summarized daily. Coding assistants,
              open source models, agents, and more.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[11px] font-mono text-primary uppercase tracking-wider mb-3">
              // navigation
            </p>
            <div className="flex flex-col gap-2 text-sm font-mono">
              <Link
                href="/"
                className="text-muted hover:text-foreground transition-colors"
              >
                ./home
              </Link>
              <Link
                href="/picks"
                className="text-muted hover:text-foreground transition-colors"
              >
                ./build-library
              </Link>
              <Link
                href="/search"
                className="text-muted hover:text-foreground transition-colors"
              >
                ./search
              </Link>
            </div>
          </div>

          {/* System */}
          <div>
            <p className="text-[11px] font-mono text-primary uppercase tracking-wider mb-3">
              // system
            </p>
            <div className="flex flex-col gap-1.5 text-[11px] font-mono text-muted">
              <div>
                <span className="text-primary">status:</span> operational
              </div>
              <div>
                <span className="text-primary">version:</span> v2.0.0-beta
              </div>
              <div>
                <span className="text-primary">stack:</span> Next.js + Supabase
              </div>
            </div>
          </div>

          {/* Subscribe */}
          <div>
            <p className="text-[11px] font-mono text-primary uppercase tracking-wider mb-3">
              // subscribe
            </p>
            <Link
              href="/subscribe"
              className="inline-block px-4 py-2 border border-primary text-primary text-[11px] font-mono hover:bg-primary hover:text-black transition-colors"
            >
              $ subscribe --force
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
          <p className="text-[11px] font-mono text-muted">
            &copy; {new Date().getFullYear()} AI News Digest
          </p>
          <p className="text-[11px] font-mono text-muted">
            _EOF<span className="animate-pulse text-primary ml-0.5">_</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
