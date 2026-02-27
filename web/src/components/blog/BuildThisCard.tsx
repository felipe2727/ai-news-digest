import Link from "next/link";

interface ProjectPick {
  name: string;
  description: string;
  why: string;
  url: string;
  category: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  tool: "\u{1F6E0}\u{FE0F}",
  framework: "\u{1F4E6}",
  model: "\u{1F9E0}",
  library: "\u{1F4DA}",
  saas: "\u{1F680}",
  community: "\u{1F465}",
  marketplace: "\u{1F6D2}",
};

export default function BuildThisCard({ pick }: { pick: ProjectPick }) {
  return (
    <Link href="/picks" className="block group h-full">
      <div className="relative border border-primary/30 bg-green-950/20 ring-1 ring-primary/10 overflow-hidden h-full flex flex-col">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        {/* Title bar */}
        <div className="relative flex items-center gap-2 px-4 py-2.5 border-b border-primary/20">
          <div className="flex items-center gap-1.5">
            <span className="window-dot bg-[#ff5f57]" />
            <span className="window-dot bg-[#febc2e]" />
            <span className="window-dot bg-[#28c840]" />
          </div>
          <span className="ml-2 text-[11px] font-mono text-primary tracking-wide font-bold uppercase">
            Build This
          </span>
          <span className="relative flex h-2 w-2 ml-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        </div>

        {/* Content */}
        <div className="relative p-5 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">
              {CATEGORY_ICONS[pick.category] || CATEGORY_ICONS.tool}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary/70">
              {pick.category}
            </span>
          </div>

          <h3 className="serif-headline text-lg leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">
            {pick.name}
          </h3>

          <p className="text-xs text-muted leading-relaxed font-mono line-clamp-2 mb-3">
            {pick.description}
          </p>

          {pick.why && (
            <div className="border-l-2 border-primary/40 pl-3 mb-4">
              <p className="text-[11px] text-primary/80 leading-relaxed font-mono">
                {pick.why}
              </p>
            </div>
          )}

          <span className="text-[11px] font-mono text-primary group-hover:underline mt-auto">
            View Specs &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
